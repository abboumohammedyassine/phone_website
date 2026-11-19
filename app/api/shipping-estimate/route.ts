// app/api/shipping-estimate/route.ts
// Frais affichés au checkout : domicile ET point relais, calculés côté serveur.
// (/api/orders recalcule de son côté : c'est lui qui fait foi pour le montant facturé.)

import { NextRequest, NextResponse } from "next/server";
import { quoteShippingOptions } from "@/lib/yalidine";
import { z } from "zod";
import { formatZodError } from "@/lib/validation";

export const dynamic = "force-dynamic";

const STORE_WILAYA_ID = Number(process.env.STORE_WILAYA_ID || 16);

const bodySchema = z.object({
  wilaya_id: z.coerce.number().int().min(1).max(100),
  commune_id: z.coerce.number().int().positive(),
});

export async function POST(req: NextRequest) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  try {
    const options = await quoteShippingOptions({
      fromWilayaId: STORE_WILAYA_ID,
      toWilayaId: parsed.data.wilaya_id,
      communeId: parsed.data.commune_id,
    });
    // home / stopdesk valent null quand Yalidine ne propose pas ce mode pour la commune.
    return NextResponse.json(options);
  } catch {
    return NextResponse.json(
      { error: "Le calcul des frais de livraison est momentanément indisponible." },
      { status: 503 }
    );
  }
}
