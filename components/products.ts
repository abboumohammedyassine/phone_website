import { supabase } from "./supabase";
import { Product } from "./types";
import { brandKey, groupBrands } from "./brand-utils";

export type SortOption = "newest" | "price_asc" | "price_desc" | "rating";

export type ProductFilters = {
  category?: string;
  brands?: string[];
  priceMin?: number;
  priceMax?: number;
  search?: string;
  sort?: SortOption;
};

export async function getFeaturedProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_featured", true)
    .limit(8);
  if (error) {
    console.error(error);
    return [];
  }
  return data as Product[];
}

export async function getProducts(filters?: ProductFilters): Promise<Product[]> {
  let query = supabase.from("products").select("*");

  if (filters?.category) query = query.eq("category", filters.category);
  if (filters?.brands && filters.brands.length > 0) {
    query = query.in("brand", filters.brands);
  }
  if (filters?.priceMin) query = query.gte("price", filters.priceMin);
  if (filters?.priceMax) query = query.lte("price", filters.priceMax);
  if (filters?.search) {
    // Cherche dans le nom OU la marque. On retire les caractères qui
    // casseraient la syntaxe du filtre .or() de Supabase (virgules,
    // parenthèses) plutôt que de les échapper.
    const safe = filters.search.replace(/[,()]/g, " ").trim();
    if (safe) {
      query = query.or(`name.ilike.%${safe}%,brand.ilike.%${safe}%`);
    }
  }

  switch (filters?.sort) {
    case "price_asc":
      query = query.order("price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false });
      break;
    case "rating":
      query = query.order("rating", { ascending: false, nullsFirst: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query;
  if (error) {
    console.error(error);
    return [];
  }
  return data as Product[];
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .single();
  if (error) return null;
  return data as Product;
}

// Liste des marques pour le filtre : une seule entrée par marque, même si certains
// produits ont été saisis "Samsung" et d'autres "SAMSUNG". `variants` sert à filtrer
// sur toutes les orthographes présentes en base.
export async function getBrandGroups(
  category?: string
): Promise<{ brands: string[]; variants: Record<string, string[]> }> {
  let query = supabase.from("products").select("brand");
  if (category) query = query.eq("category", category);

  const { data, error } = await query;
  if (error || !data) return { brands: [], variants: {} };
  return groupBrands(data.map((d: any) => d.brand));
}

export async function getBrands(category?: string): Promise<string[]> {
  return (await getBrandGroups(category)).brands;
}

/** Transforme les marques choisies en toutes leurs orthographes présentes en base. */
export function expandBrands(
  selected: string[],
  variants: Record<string, string[]>
): string[] {
  const out = new Set<string>();
  for (const b of selected) {
    const found = variants[brandKey(b)];
    if (found && found.length) found.forEach((v) => out.add(v));
    else out.add(b);
  }
  return Array.from(out);
}

export async function getPriceRange(
  category?: string
): Promise<{ min: number; max: number }> {
  let query = supabase.from("products").select("price");
  if (category) query = query.eq("category", category);

  const { data, error } = await query;
  if (error || !data || data.length === 0) return { min: 0, max: 500000 };
  const prices = data.map((d: any) => d.price);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}
