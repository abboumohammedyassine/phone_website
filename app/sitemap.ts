import { supabase } from "@/lib/supabase";
import { SITE_URL } from "@/lib/site";
import type { MetadataRoute } from "next";

// Les nouveaux produits entrent dans le sitemap sans redéploiement.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Lecture publique (clé anon, protégée par RLS) : le sitemap n'a pas besoin de service_role.
  const { data: products, error } = await supabase
    .from("products")
    .select("slug, created_at");

  if (error) console.error("sitemap: lecture des produits impossible", error);

  const productUrls = (products ?? []).map((p: { slug: string; created_at: string }) => ({
    url: `${SITE_URL}/produit/${p.slug}`,
    lastModified: new Date(p.created_at),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [
    { url: SITE_URL, lastModified: new Date(), priority: 1 },
    { url: `${SITE_URL}/catalogue`, lastModified: new Date(), priority: 0.9 },
    ...productUrls,
  ];
}
