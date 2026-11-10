// app/api/admin/upload/route.ts — envoi d'une image produit vers Supabase Storage (admin uniquement).
//
// Sécurité :
//  - accès admin vérifié (requireAdmin), en plus du middleware ;
//  - le type réel du fichier est lu dans ses premiers octets (le MIME du navigateur est falsifiable) ;
//  - nom de fichier généré côté serveur (jamais celui envoyé : pas de chemin piégé) ;
//  - taille limitée à 4 Mo : Vercel refuse de toute façon les requêtes > 4,5 Mo.
//    Le navigateur redimensionne les photos avant l'envoi (voir lib/image-utils.ts).

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-guard";
import { detectImageType } from "@/lib/image-validation";

export const dynamic = "force-dynamic";

const BUCKET = "product-images";
const MAX_BYTES = 4 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image trop lourde (4 Mo maximum)." }, { status: 413 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = detectImageType(bytes);
  if (!type) {
    return NextResponse.json(
      { error: "Format non supporté : JPEG, PNG ou WebP uniquement." },
      { status: 415 }
    );
  }

  const db = supabaseAdmin();
  const path = `products/${new Date().getFullYear()}/${randomUUID()}.${type.ext}`;

  const { error } = await db.storage.from(BUCKET).upload(path, bytes, {
    contentType: type.mime,
    cacheControl: "31536000", // 1 an : le nom change à chaque envoi, le cache est sans risque
    upsert: false,
  });

  if (error) {
    console.error("upload failed", error);
    return NextResponse.json(
      {
        error:
          "Envoi impossible. Vérifie que le bucket « product-images » existe (migration 001 exécutée).",
      },
      { status: 500 }
    );
  }

  const { data } = db.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
