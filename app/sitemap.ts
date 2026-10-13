import { supabaseAdmin } from "@/lib/supabase";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: products } = await supabaseAdmin()
    .from("products")
    .select("slug, created_at");

  const productUrls = (products ?? []).map((p: { slug: string; created_at: string }) => ({
    url: `https://phonehouse-maghnia.com/produit/${p.slug}`,
    lastModified: new Date(p.created_at),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [
    { url: "https://phonehouse-maghnia.com", lastModified: new Date(), priority: 1 },
    { url: "https://phonehouse-maghnia.com/catalogue", lastModified: new Date(), priority: 0.9 },
    ...productUrls,
  ];
}