import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import type { Product } from "@/lib/types";
import ProduitForm from "../ProduitForm";

export const dynamic = "force-dynamic";

async function getProduct(id: string): Promise<Product | null> {
  const { data, error } = await supabaseAdmin()
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as Product;
}

export default async function EditProduitPage({
  params,
}: {
  params: { id: string };
}) {
  const product = await getProduct(params.id);
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="mb-6 font-display text-2xl font-600">Modifier {product.name}</h1>
      <ProduitForm initialProduct={product} />
    </div>
  );
}
