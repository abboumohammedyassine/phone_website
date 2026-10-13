import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-guard";

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await req.json();
  const {
    name,
    slug,
    brand,
    category,
    price,
    compare_at_price,
    stock,
    images,
    colors,
    storage_options,
    specs,
    description,
    is_featured,
  } = body;

  if (!name || !slug || !category || price === undefined) {
    return NextResponse.json(
      { error: "Nom, slug, catégorie et prix sont requis." },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin()
    .from("products")
    .insert({
      name,
      slug,
      brand,
      category,
      price,
      compare_at_price: compare_at_price ?? null,
      stock: stock ?? 0,
      images: images ?? [],
      colors: colors ?? [],
      storage_options: storage_options ?? [],
      specs: specs ?? {},
      description: description ?? null,
      is_featured: !!is_featured,
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
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ product: data }, { status: 201 });
}
