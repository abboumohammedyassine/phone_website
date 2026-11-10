// app/api/orders/route.ts
// Création d'une commande COD. Principe : le navigateur n'est JAMAIS cru sur
// les prix, les frais, le total ni le stock — tout est recalculé ici.

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createCodParcel, quoteShipping } from "@/lib/yalidine";
import { checkoutSchema, formatZodError } from "@/lib/validation";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const STORE_WILAYA_ID = Number(process.env.STORE_WILAYA_ID || 16); // Alger par défaut

type DB = ReturnType<typeof supabaseAdmin>;

/** Remet en stock (best effort) les quantités déjà réservées. */
async function releaseAll(db: DB, reserved: Array<[string, number]>) {
  for (const [productId, qty] of reserved) {
    const { error } = await db.rpc("release_stock", {
      p_product_id: productId,
      p_qty: qty,
    });
    if (error) console.error("release_stock failed", productId, qty, error);
  }
}

export async function POST(req: NextRequest) {
  // Anti-abus : de fausses commandes en rafale pourraient réserver tout le stock.
  // Limite volontairement large (réseaux mobiles = IP partagées entre plusieurs clients).
  if (!rateLimit(`orders:${clientIp(req)}`, 8, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Trop de commandes en peu de temps. Réessaie dans quelques minutes." },
      { status: 429 }
    );
  }

  /* 1. Lecture + validation stricte (Zod) --------------------------- */
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const parsed = checkoutSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }
  const input = parsed.data; // téléphone déjà normalisé en 0XXXXXXXXX
  const db = supabaseAdmin();

  /* 2. Quantité totale demandée par produit (variantes cumulées) ----- */
  const wanted = new Map<string, number>();
  for (const it of input.items) {
    wanted.set(it.productId, (wanted.get(it.productId) ?? 0) + it.qty);
  }

  /* 3. Relecture des produits en base (prix, stock, options) --------- */
  const { data: products, error: productsError } = await db
    .from("products")
    .select("id, name, price, stock, images, colors, storage_options")
    .in("id", [...wanted.keys()]);

  if (productsError || !products) {
    console.error("products lookup failed", productsError);
    return NextResponse.json(
      { error: "Impossible de vérifier le panier. Réessaie dans un instant." },
      { status: 500 }
    );
  }
  const byId = new Map(products.map((p) => [p.id as string, p]));

  /* 4. Validation des lignes + snapshot fiable ----------------------- */
  const items: Array<{
    productId: string;
    name: string;
    image: string;
    price: number;
    color?: string;
    storage?: string;
    qty: number;
  }> = [];
  let subtotal = 0;

  for (const it of input.items) {
    const p = byId.get(it.productId);
    if (!p) {
      return NextResponse.json(
        { error: "Un produit de ton panier n'est plus disponible." },
        { status: 400 }
      );
    }

    const colors: string[] = p.colors ?? [];
    const storages: string[] = p.storage_options ?? [];

    if (colors.length > 0 && (!it.color || !colors.includes(it.color))) {
      return NextResponse.json(
        { error: `Choisis une couleur valide pour « ${p.name} ».` },
        { status: 400 }
      );
    }
    if (storages.length > 0 && (!it.storage || !storages.includes(it.storage))) {
      return NextResponse.json(
        { error: `Choisis une capacité valide pour « ${p.name} ».` },
        { status: 400 }
      );
    }

    items.push({
      productId: p.id,
      name: p.name,
      image: p.images?.[0] ?? "",
      price: p.price, // ← prix de la BASE, jamais celui du navigateur
      color: colors.length > 0 ? it.color : undefined,
      storage: storages.length > 0 ? it.storage : undefined,
      qty: it.qty,
    });
    subtotal += p.price * it.qty;
  }

  /* 5. Contrôle du stock (message clair avant toute réservation) ----- */
  for (const [productId, qty] of wanted) {
    const p = byId.get(productId)!;
    if (p.stock < qty) {
      return NextResponse.json(
        {
          code: "OUT_OF_STOCK",
          error:
            p.stock <= 0
              ? `« ${p.name} » est en rupture de stock.`
              : `Il ne reste que ${p.stock} exemplaire(s) de « ${p.name} ».`,
        },
        { status: 409 }
      );
    }
  }

  /* 6. Frais de livraison calculés côté serveur ---------------------- */
  let shippingCost: number;
  try {
    shippingCost = (
      await quoteShipping({
        fromWilayaId: STORE_WILAYA_ID,
        toWilayaId: input.wilaya_id,
        communeId: input.commune_id,
        deliveryType: input.delivery_type,
      })
    ).fee;
  } catch {
    return NextResponse.json(
      {
        error:
          "Impossible de calculer les frais de livraison pour le moment. Réessaie dans quelques minutes.",
      },
      { status: 503 }
    );
  }
  const total = subtotal + shippingCost;

  /* 7. Réservation ATOMIQUE du stock (fonction SQL, anti-survente) --- */
  const reserved: Array<[string, number]> = [];
  for (const [productId, qty] of wanted) {
    const { data: ok, error } = await db.rpc("reserve_stock", {
      p_product_id: productId,
      p_qty: qty,
    });

    if (error) {
      // Fonction absente ? => la migration SQL n'a pas été exécutée.
      console.error("reserve_stock failed (migration 001 exécutée ?)", error);
      await releaseAll(db, reserved);
      return NextResponse.json(
        { error: "Commande momentanément indisponible." },
        { status: 500 }
      );
    }
    if (ok !== true) {
      // Quelqu'un a pris les dernières unités entre-temps.
      await releaseAll(db, reserved);
      const p = byId.get(productId)!;
      return NextResponse.json(
        {
          code: "OUT_OF_STOCK",
          error: `« ${p.name} » vient de passer en rupture de stock.`,
        },
        { status: 409 }
      );
    }
    reserved.push([productId, qty]);
  }

  /* 8. Enregistrement de la commande --------------------------------- */
  const { data: order, error: insertError } = await db
    .from("orders")
    .insert({
      full_name: input.full_name,
      phone: input.phone,
      wilaya_id: input.wilaya_id,
      commune_id: input.commune_id,
      address: input.address,
      delivery_type: input.delivery_type,
      items,
      subtotal,
      shipping_cost: shippingCost,
      total,
      payment_method: "cod",
      status: "pending",
    })
    .select("id, status, yalidine_tracking")
    .single();

  if (insertError || !order) {
    console.error("order insert failed", insertError);
    await releaseAll(db, reserved); // on ne garde pas du stock pour une commande inexistante
    return NextResponse.json(
      { error: "Impossible d'enregistrer la commande." },
      { status: 500 }
    );
  }

  /* 9. Colis Yalidine (le livreur encaisse le montant en espèces) ---- */
  try {
    const parcel = await createCodParcel({
      orderId: order.id,
      fullName: input.full_name,
      phone: input.phone,
      fromWilayaId: STORE_WILAYA_ID,
      toWilayaId: input.wilaya_id,
      toCommuneId: input.commune_id,
      address: input.address,
      deliveryType: input.delivery_type,
      codAmount: subtotal, // produits seulement : Yalidine ajoute la livraison
      productLabel: items.map((i) => `${i.name} x${i.qty}`).join(", "),
    });

    await db
      .from("orders")
      .update({ yalidine_tracking: parcel.tracking, status: "confirmed" })
      .eq("id", order.id);

    return NextResponse.json({
      order: { id: order.id, status: "confirmed", yalidine_tracking: parcel.tracking },
      shipping_cost: shippingCost,
      total,
    });
  } catch (err) {
    // La commande reste "pending" (stock conservé) : traitement manuel depuis /admin.
    console.error("Yalidine parcel creation failed:", err);
    return NextResponse.json({
      order: { id: order.id, status: "pending", yalidine_tracking: null },
      shipping_cost: shippingCost,
      total,
      warning:
        "Commande enregistrée, mais l'étiquette Yalidine n'a pas pu être générée automatiquement. Elle sera créée manuellement.",
    });
  }
}