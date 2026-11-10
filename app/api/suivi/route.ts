// app/api/suivi/route.ts — suivi public d'une commande.
//
// Protection de la vie privée :
//  - il faut le téléphone ET le numéro de commande (ou de suivi Yalidine) : le téléphone seul ne suffit pas ;
//  - la réponse ne contient ni adresse ni téléphone ;
//  - si rien ne correspond, la réponse est identique que le téléphone existe ou non
//    (impossible de savoir si un numéro a déjà commandé) ;
//  - nombre de tentatives limité par visiteur.

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { trackingLookupSchema, formatZodError } from "@/lib/validation";
import { findOrderByRef, toPublicOrder, type TrackableOrder } from "@/lib/tracking";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const NOT_FOUND = "Aucune commande ne correspond à ces informations. Vérifie ton numéro de téléphone et ton numéro de commande.";

export async function POST(req: NextRequest) {
  if (!rateLimit(`suivi:${clientIp(req)}`, 10, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessaie dans quelques minutes." },
      { status: 429 }
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const parsed = trackingLookupSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }
  const { phone, ref } = parsed.data; // téléphone déjà normalisé (0XXXXXXXXX)

  const { data, error } = await supabaseAdmin()
    .from("orders")
    .select(
      "id, status, items, subtotal, shipping_cost, total, delivery_type, yalidine_tracking, created_at"
    )
    .eq("phone", phone)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("tracking lookup failed", error);
    return NextResponse.json(
      { error: "Service momentanément indisponible. Réessaie dans un instant." },
      { status: 500 }
    );
  }

  const order = findOrderByRef((data ?? []) as TrackableOrder[], ref);
  if (!order) {
    return NextResponse.json({ error: NOT_FOUND }, { status: 404 });
  }

  return NextResponse.json({ order: toPublicOrder(order) });
}
