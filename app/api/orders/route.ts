import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createCodParcel, getShippingFee } from "@/lib/yalidine";
import { Order } from "@/lib/types";

const STORE_WILAYA_ID = Number(process.env.STORE_WILAYA_ID || 16); // Alger par défaut

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Omit<Order, "id" | "status" | "created_at">;

  if (!body.items?.length) {
    return NextResponse.json({ error: "Panier vide." }, { status: 400 });
  }
  if (!body.full_name || !body.phone || !body.wilaya_id || !body.commune_id || !body.address) {
    return NextResponse.json(
      { error: "Coordonnées de livraison incomplètes." },
      { status: 400 }
    );
  }

  const db = supabaseAdmin();

  // 1. Recalcule les frais de livraison côté serveur (ne jamais faire confiance au client)
  const shippingCost = await getShippingFee({
    fromWilayaId: STORE_WILAYA_ID,
    toWilayaId: body.wilaya_id,
    deliveryType: body.delivery_type,
  });
  const total = body.subtotal + shippingCost;

  // 2. Enregistre la commande, statut "pending" tant que le colis Yalidine
  //    n'est pas créé. Paiement = cash à la livraison uniquement.
  const { data: order, error } = await db
    .from("orders")
    .insert({
      full_name: body.full_name,
      phone: body.phone,
      wilaya_id: body.wilaya_id,
      commune_id: body.commune_id,
      address: body.address,
      delivery_type: body.delivery_type,
      items: body.items,
      subtotal: body.subtotal,
      shipping_cost: shippingCost,
      total,
      payment_method: "cod",
      status: "pending",
    })
    .select()
    .single();

  if (error || !order) {
    console.error(error);
    return NextResponse.json(
      { error: "Impossible d'enregistrer la commande." },
      { status: 500 }
    );
  }

  // 3. Crée le colis chez Yalidine avec le montant COD = total de la commande.
  //    C'est le livreur Yalidine qui encaisse ce montant en espèces.
  try {
    const parcel = await createCodParcel({
      orderId: order.id,
      fullName: body.full_name,
      phone: body.phone,
      fromWilayaId: STORE_WILAYA_ID,
      toWilayaId: body.wilaya_id,
      toCommuneId: body.commune_id,
      address: body.address,
      deliveryType: body.delivery_type,
      codAmount: total,
      productLabel: body.items.map((i) => `${i.name} x${i.qty}`).join(", "),
    });

    await db
      .from("orders")
      .update({ yalidine_tracking: parcel.tracking, status: "confirmed" })
      .eq("id", order.id);

    return NextResponse.json({
      order: { ...order, yalidine_tracking: parcel.tracking, status: "confirmed" },
      shipping_cost: shippingCost,
      total,
    });
  } catch (err) {
    console.error("Yalidine parcel creation failed:", err);
    // La commande reste enregistrée "pending" — à traiter manuellement
    // depuis l'admin si l'appel Yalidine échoue (ex: solde compte pro insuffisant).
    return NextResponse.json({
      order,
      shipping_cost: shippingCost,
      total,
      warning:
        "Commande enregistrée, mais l'étiquette Yalidine n'a pas pu être générée automatiquement. Elle sera créée manuellement.",
    });
  }
}
