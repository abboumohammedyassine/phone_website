 import { Suspense } from "react";
import { supabaseAdmin } from "@/lib/supabase";
import type { Product } from "@/lib/types";
import ProductGrid from "@/components/ProductGrid";
import CatalogueFilters from "@/components/CatalogueFilters";

export const dynamic = "force-dynamic";

const CATEGORIES = [
  { value: "", label: "Tout" },
  { value: "telephones", label: "Téléphones" },
  { value: "pc", label: "PC & Portables" },
  { value: "audio", label: "Audio" },
  { value: "accessoires", label: "Accessoires" },
];

async function getProducts(cat?: string, q?: string): Promise<Product[]> {
  let query = supabaseAdmin()
    .from("products")
    .select("*")
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (cat) query = query.eq("category", cat);
  if (q) query = query.ilike("name", `%${q}%`);

  const { data } = await query;
  return (data as Product[]) ?? [];
}

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: { cat?: string; q?: string; sort?: string };
}) {
  const { cat, q, sort } = searchParams;
  let products = await getProducts(cat, q);

  // Tri côté serveur
  if (sort === "price_asc") products.sort((a, b) => a.price - b.price);
  if (sort === "price_desc") products.sort((a, b) => b.price - a.price);
  if (sort === "discount") {
    products = products.filter((p) => p.compare_at_price);
  }

  const activeCat = CATEGORIES.find((c) => c.value === (cat ?? "")) ?? CATEGORIES[0];

  return (
    <div className="mx-auto max-w-7xl px-5 py-10">
      {/* Header */}
      <div className="mb-8">
        <p className="font-mono text-xs uppercase tracking-widest text-cyan-400">Catalogue</p>
        <h1 className="mt-1 font-display text-3xl font-600">
          {q ? `Résultats pour "${q}"` : activeCat.label === "Tout" ? "Tous les produits" : activeCat.label}
        </h1>
        <p className="mt-1 text-sm text-steel-400">{products.length} produit(s)</p>
      </div>

      {/* Filtres */}
      <CatalogueFilters categories={CATEGORIES} activeCat={cat ?? ""} activeSort={sort ?? ""} activeQ={q ?? ""} />

      {/* Grille */}
      <div className="mt-8">
        <Suspense fallback={<div className="py-20 text-center text-steel-400">Chargement...</div>}>
          <ProductGrid products={products} />
        </Suspense>
      </div>
    </div>
  );
}
