// Ajoute ces exports dans ton app/layout.tsx existant
// (remplace ou fusionne avec ton <head> actuel)

import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://phonehouse-maghnia.com"), // remplace par ton vrai domaine
  title: {
    default: "Phone House Maghnia — Téléphones, PC & Accessoires en Algérie",
    template: "%s | Phone House Maghnia",
  },
  description:
    "Achetez vos téléphones, PC portables, audio et accessoires en Algérie. Paiement à la livraison (COD) partout dans les 58 wilayas via Yalidine.",
  keywords: [
    "téléphone Algérie", "smartphone Algeria", "iPhone Algérie", "Samsung Algérie",
    "PC portable Algérie", "livraison Algérie", "COD Algérie", "Phone House Maghnia",
  ],
  openGraph: {
    type: "website",
    locale: "fr_DZ",
    siteName: "Phone House Maghnia",
    title: "Phone House Maghnia — La tech livrée jusqu'à ta porte",
    description: "Téléphones, PC, audio et accessoires. Paiement à la livraison partout en Algérie.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "Phone House Maghnia" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Phone House Maghnia — La tech livrée jusqu'à ta porte",
    description: "Paiement à la livraison partout en Algérie.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

// ── SITEMAP (fichier séparé : app/sitemap.ts) ──────────────────────────────
// Crée app/sitemap.ts avec ce contenu :

/*
import { supabaseAdmin } from "@/lib/supabase";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: products } = await supabaseAdmin()
    .from("products")
    .select("slug, created_at");

  const productUrls = (products ?? []).map((p) => ({
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
*/