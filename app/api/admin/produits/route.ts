// app/api/admin/produits/route.ts — création d'un produit (admin uniquement)

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-guard";
import { productSchema, formatZodError } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const parsed = productSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }
  const p = parsed.data;

  const { data, error } = await supabaseAdmin()
    .from("products")
    .insert({
      name: p.name,
      slug: p.slug,
      brand: p.brand,
      category: p.category,
      price: p.price,
      compare_at_price: p.compare_at_price ?? null,
      stock: p.stock,
      images: p.images,
      colors: p.colors,
      storage_options: p.storage_options,
      specs: p.specs,
      description: p.description ?? null,
      is_featured: p.is_featured,
    })
    .select()
    .single();

  if (error) {
    // Slug déjà utilisé -> contrainte unique en base
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Ce slug est déjà utilisé par un autre produit." },
        { status: 409 }
      );
    }
    console.error("product insert failed", error);
    return NextResponse.json({ error: "Impossible de créer le produit." }, { status: 400 });
  }

  return NextResponse.json({ product: data }, { status: 201 });
}
