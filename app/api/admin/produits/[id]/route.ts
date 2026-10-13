import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-guard";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

  const update: Record<string, unknown> = {};
  if (name !== undefined) update.name = name;
  if (slug !== undefined) update.slug = slug;
  if (brand !== undefined) update.brand = brand;
  if (category !== undefined) update.category = category;
  if (price !== undefined) update.price = price;
  if (compare_at_price !== undefined) update.compare_at_price = compare_at_price;
  if (stock !== undefined) update.stock = stock;
  if (images !== undefined) update.images = images;
  if (colors !== undefined) update.colors = colors;
  if (storage_options !== undefined) update.storage_options = storage_options;
  if (specs !== undefined) update.specs = specs;
  if (description !== undefined) update.description = description;
  if (is_featured !== undefined) update.is_featured = is_featured;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Rien à mettre à jour." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin()
    .from("products")
    .update(update)
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Ce slug est déjà utilisé par un autre produit." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (!data) {
    return NextResponse.json({ error: "Produit introuvable." }, { status: 404 });
  }

  return NextResponse.json({ product: data });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { error } = await supabaseAdmin()
    .from("products")
    .delete()
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
