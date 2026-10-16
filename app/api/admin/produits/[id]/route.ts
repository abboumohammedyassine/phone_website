// app/api/admin/produits/[id]/route.ts — modification / suppression (admin uniquement)

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-guard";
import { productPatchSchema, formatZodError } from "@/lib/validation";

const idSchema = z.string().uuid();

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  if (!idSchema.safeParse(params.id).success) {
    return NextResponse.json({ error: "Identifiant invalide." }, { status: 400 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const parsed = productPatchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  // On ne met à jour que les champs réellement fournis.
  const update = Object.fromEntries(
    Object.entries(parsed.data).filter(([, v]) => v !== undefined)
  );
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Rien à mettre à jour." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin()
    .from("products")
    .update(update)
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Ce slug est déjà utilisé par un autre produit." },
        { status: 409 }
      );
    }
    // PGRST116 = aucune ligne trouvée avec cet id
    if (error.code === "PGRST116") {
      return NextResponse.json({ error: "Produit introuvable." }, { status: 404 });
    }
    console.error("product update failed", error);
    return NextResponse.json({ error: "Impossible de modifier le produit." }, { status: 400 });
  }

  return NextResponse.json({ product: data });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  if (!idSchema.safeParse(params.id).success) {
    return NextResponse.json({ error: "Identifiant invalide." }, { status: 400 });
  }

  const { error } = await supabaseAdmin().from("products").delete().eq("id", params.id);

  if (error) {
    console.error("product delete failed", error);
    return NextResponse.json({ error: "Suppression impossible." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
