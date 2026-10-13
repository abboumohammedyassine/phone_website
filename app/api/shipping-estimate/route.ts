import { NextRequest, NextResponse } from "next/server";
import { getShippingFee } from "@/lib/yalidine";

const STORE_WILAYA_ID = Number(process.env.STORE_WILAYA_ID || 16);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { wilaya_id, delivery_type } = body;

    if (!wilaya_id || !delivery_type) {
      return NextResponse.json(
        { error: "Wilaya et type de livraison requis." },
        { status: 400 }
      );
    }

    if (delivery_type !== "home" && delivery_type !== "stopdesk") {
      return NextResponse.json(
        { error: "Type de livraison invalide." },
        { status: 400 }
      );
    }

    const shipping_cost = await getShippingFee({
      fromWilayaId: STORE_WILAYA_ID,
      toWilayaId: Number(wilaya_id),
      deliveryType: delivery_type,
    });

    return NextResponse.json({ shipping_cost });
  } catch (err) {
    console.error("Shipping estimate error:", err);
    return NextResponse.json(
      { error: "Impossible de calculer les frais de livraison." },
      { status: 500 }
    );
  }
}