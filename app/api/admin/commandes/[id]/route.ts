// app/api/admin/commandes/[id]/route.ts
// Mise à jour du statut / du suivi d'une commande (admin uniquement).
// Une commande annulée remet ses articles en stock ; la réactiver les re-réserve.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-guard";

const VALID_STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"] as const;

const bodySchema = z.object({
  status: z.enum(VALID_STATUSES).optional(),
  yalidine_tracking: z.string().trim().max(60).optional(),
});

type DB = ReturnType<typeof supabaseAdmin>;
type StockLine = { productId: string; qty: number };

/** Regroupe les lignes par produit (plusieurs variantes d'un même produit). */
function aggregate(items: unknown): Array<[string, number]> {
  const map = new Map<string, number>();
  for (const it of (Array.isArray(items) ? items : []) as StockLine[]) {
    if (!it?.productId || !Number.isInteger(it.qty) || it.qty <= 0) continue;
    map.set(it.productId, (map.get(it.productId) ?? 0) + it.qty);
  }
  return [...map.entries()];
}

async function release(db: DB, lines: Array<[string, number]>) {
  for (const [productId, qty] of lines) {
    const { error } = await db.rpc("release_stock", { p_product_id: productId, p_qty: qty });
    if (error) console.error("release_stock failed", productId, error);
  }
}

/** Re-réserve toutes les lignes ; si l'une échoue, annule ce qui a été pris. */
async function reserve(db: DB, lines: Array<[string, number]>): Promise<boolean> {
  const done: Array<[string, number]> = [];
  for (const [productId, qty] of lines) {
    const { data: ok, error } = await db.rpc("reserve_stock", {
      p_product_id: productId,
      p_qty: qty,
    });
    if (error || ok !== true) {
      await release(db, done);
      return false;
    }
    done.push([productId, qty]);
  }
  return true;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  if (!z.string().uuid().safeParse(params.id).success) {
    return NextResponse.json({ error: "Identifiant invalide." }, { status: 400 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Statut invalide." }, { status: 400 });
  }
  const { status, yalidine_tracking } = parsed.data;

  const update: Record<string, unknown> = {};
  if (status) update.status = status;
  if (yalidine_tracking !== undefined) update.yalidine_tracking = yalidine_tracking || null;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Rien à mettre à jour." }, { status: 400 });
  }

  const db = supabaseAdmin();

  const { data: current, error: currentError } = await db
    .from("orders")
    .select("status, items")
    .eq("id", params.id)
    .single();

  if (currentError || !current) {
    return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });
  }

  /* Gestion du stock lors d'une annulation / réactivation ------------ */
  const lines = aggregate(current.items);
  const wasCancelled = current.status === "cancelled";
  const willCancel = status === "cancelled";
  let stockAction: "released" | "reserved" | null = null;

  if (status && !wasCancelled && willCancel) {
    await release(db, lines);
    stockAction = "released";
  } else if (status && wasCancelled && !willCancel) {
    const ok = await reserve(db, lines);
    if (!ok) {
      return NextResponse.json(
        { error: "Stock insuffisant pour réactiver cette commande." },
        { status: 409 }
      );
    }
    stockAction = "reserved";
  }

  const { data, error } = await db
    .from("orders")
    .update(update)
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    // L'update a échoué : on annule l'ajustement de stock qu'on venait de faire.
    if (stockAction === "released") await reserve(db, lines);
    if (stockAction === "reserved") await release(db, lines);
    console.error("order update failed", error);
    return NextResponse.json({ error: "Mise à jour impossible." }, { status: 400 });
  }

  return NextResponse.json({ order: data });
}
