// app/api/admin/yalidine-debug/route.ts — DIAGNOSTIC des tarifs Yalidine (admin uniquement).
//
// À ouvrir dans le navigateur, connecté à /admin, par exemple :
//   /api/admin/yalidine-debug?to=19&name=Ain Azel
//   /api/admin/yalidine-debug?to=19&commune=1901
// Il montre ce que Yalidine répond réellement pour cette commune (tarifs domicile / point relais,
// forme de la réponse). Aucun secret n'est renvoyé.

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { inspectFees } from "@/lib/yalidine";

export const dynamic = "force-dynamic";

const STORE_WILAYA_ID = Number(process.env.STORE_WILAYA_ID || 16);

export async function GET(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const sp = req.nextUrl.searchParams;
  const to = Number(sp.get("to"));
  const from = sp.get("from") ? Number(sp.get("from")) : STORE_WILAYA_ID;
  const communeId = sp.get("commune") ? Number(sp.get("commune")) : undefined;
  const communeName = sp.get("name")?.slice(0, 60) || undefined;

  if (!Number.isInteger(to) || to < 1 || to > 100 || !Number.isInteger(from) || from < 1) {
    return NextResponse.json(
      { error: "Paramètre « to » (id de la wilaya de destination) requis. Ex. ?to=19&name=Ain Azel" },
      { status: 400 }
    );
  }

  try {
    const result = await inspectFees({
      fromWilayaId: from,
      toWilayaId: to,
      communeId,
      communeName,
    });
    return NextResponse.json({ fromWilayaId: from, toWilayaId: to, ...result });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Appel Yalidine impossible.", detail: String(err?.message ?? err).slice(0, 300) },
      { status: 502 }
    );
  }
}
