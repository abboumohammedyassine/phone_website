import { NextRequest, NextResponse } from "next/server";
import { getCommunes } from "@/lib/yalidine";

export async function GET(req: NextRequest) {
  const wilayaId = req.nextUrl.searchParams.get("wilaya_id");
  if (!wilayaId) {
    return NextResponse.json({ error: "wilaya_id requis" }, { status: 400 });
  }
  try {
    const communes = await getCommunes(Number(wilayaId));
    return NextResponse.json({ communes });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Impossible de charger les communes Yalidine." },
      { status: 500 }
    );
  }
}
