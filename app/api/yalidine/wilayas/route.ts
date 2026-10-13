import { NextResponse } from "next/server";
import { getWilayas } from "@/lib/yalidine";

export async function GET() {
  try {
    const wilayas = await getWilayas();
    return NextResponse.json({ wilayas });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Impossible de charger les wilayas Yalidine." },
      { status: 500 }
    );
  }
}
