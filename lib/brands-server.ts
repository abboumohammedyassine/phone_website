// lib/brands-server.ts — SERVEUR UNIQUEMENT (utilise la clé service_role).
import { supabaseAdmin } from "@/lib/supabase";
import { groupBrands, resolveBrand } from "@/lib/brand-utils";

/** Marques déjà utilisées dans la boutique, une orthographe par marque. */
export async function getExistingBrands(): Promise<string[]> {
  const { data, error } = await supabaseAdmin().from("products").select("brand");
  if (error || !data) return [];
  return groupBrands(data.map((d: { brand: string }) => d.brand)).brands;
}

/** Aligne la marque envoyée sur celle qui existe déjà ("SAMSUNG" -> "Samsung"). */
export async function canonicalBrand(input: string): Promise<string> {
  return resolveBrand(input, await getExistingBrands());
}
