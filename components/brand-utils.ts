// lib/brand-utils.ts
// Fonctions pures (utilisables côté navigateur ET serveur) pour qu'une marque
// n'apparaisse qu'UNE seule fois : "Samsung", "SAMSUNG" et " samsung " = même marque.

/** Clé de comparaison : minuscules, sans accents, espaces normalisés. */
export function brandKey(brand: string): string {
  return brand
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Nettoie ce que l'admin a tapé : espaces en trop retirés. */
export function cleanBrand(brand: string): string {
  return brand.replace(/\s+/g, " ").trim();
}

export type BrandGroups = {
  /** Une seule orthographe par marque, triée A→Z. */
  brands: string[];
  /** clé -> toutes les orthographes réellement présentes en base (pour filtrer). */
  variants: Record<string, string[]>;
};

/**
 * Regroupe une liste brute de marques (une entrée par produit).
 * L'orthographe retenue est la plus fréquente ; à égalité, on évite le tout-majuscules.
 */
export function groupBrands(rawBrands: string[]): BrandGroups {
  const counts = new Map<string, Map<string, number>>();
  for (const raw of rawBrands) {
    if (!raw) continue;
    const key = brandKey(raw);
    if (!key) continue;
    const spellings = counts.get(key) ?? new Map<string, number>();
    spellings.set(raw, (spellings.get(raw) ?? 0) + 1);
    counts.set(key, spellings);
  }

  const brands: string[] = [];
  const variants: Record<string, string[]> = {};

  counts.forEach((spellings, key) => {
    const sorted = Array.from(spellings.entries()).sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      const aUpper = a[0] === a[0].toUpperCase() ? 1 : 0;
      const bUpper = b[0] === b[0].toUpperCase() ? 1 : 0;
      if (aUpper !== bUpper) return aUpper - bUpper;
      return a[0].localeCompare(b[0]);
    });
    brands.push(sorted[0][0]);
    variants[key] = sorted.map(([name]) => name);
  });

  brands.sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));
  return { brands, variants };
}

/** Si la marque tapée existe déjà (même en autre casse), renvoie l'orthographe existante. */
export function resolveBrand(input: string, existing: string[]): string {
  const cleaned = cleanBrand(input);
  const key = brandKey(cleaned);
  if (!key) return cleaned;
  return existing.find((b) => brandKey(b) === key) ?? cleaned;
}
