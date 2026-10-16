// app/api/shipping-estimate/route.ts
// Estimation des frais affichée au checkout. Même logique que /api/orders
// (c'est /api/orders qui fait foi pour le montant réellement facturé).

import { NextRequest, NextResponse } from "next/server";
import { quoteShipping } from "@/lib/yalidine";
import { shippingEstimateSchema, formatZodError } from "@/lib/validation";

export const dynamic = "force-dynamic";

const STORE_WILAYA_ID = Number(process.env.STORE_WILAYA_ID || 16);

export async function POST(req: NextRequest) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const parsed = shippingEstimateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  try {
    const { fee, source } = await quoteShipping({
      fromWilayaId: STORE_WILAYA_ID,
      toWilayaId: parsed.data.wilaya_id,
      communeId: parsed.data.commune_id,
      deliveryType: parsed.data.delivery_type,
    });
    return NextResponse.json({ shipping_cost: fee, source });
  } catch {
    return NextResponse.json(
      { error: "Impossible de calculer les frais de livraison pour cette destination." },
      { status: 503 }
    );
  }
}
