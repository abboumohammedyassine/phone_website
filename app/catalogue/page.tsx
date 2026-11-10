import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getBrands } from "@/lib/products";
import type { Product } from "@/lib/types";
import ProductGrid from "@/components/ProductGrid";
import CatalogueFilters from "@/components/CatalogueFilters";
import Pagination from "@/components/Pagination";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

const CATEGORIES = [
  { value: "", label: "Tout" },
  { value: "telephones", label: "Téléphones" },
  { value: "pc", label: "PC & Portables" },
  { value: "audio", label: "Audio" },
  { value: "accessoires", label: "Accessoires" },
];

const VALID_SORTS = ["newest", "price_asc", "price_desc", "discount"];

type RawParams = {
  cat?: string;
  q?: string;
  sort?: string;
  brand?: string | string[];
  min?: string;
  max?: string;
  page?: string;
};

/** Entier positif ou undefined : une valeur invalide dans l'URL est simplement ignorée. */
function toInt(value?: string): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : undefined;
}

type Filters = {
  cat: string;
  q: string;
  sort: string;
  brands: string[];
  min?: number;
  max?: number;
  page: number;
};

function parseFilters(raw: RawParams): Filters {
  const cat = CATEGORIES.some((c) => c.value === raw.cat) ? (raw.cat as string) : "";
  const sort = VALID_SORTS.includes(raw.sort ?? "") ? (raw.sort as string) : "";
  const brands = (Array.isArray(raw.brand) ? raw.brand : raw.brand ? [raw.brand] : [])
    .map((b) => b.trim())
    .filter(Boolean)
    .slice(0, 20);

  let min = toInt(raw.min);
  let max = toInt(raw.max);
  if (min !== undefined && max !== undefined && min > max) [min, max] = [max, min];

  return {
    cat,
    q: (raw.q ?? "").trim().slice(0, 80),
    sort,
    brands,
    min,
    max,
    page: Math.max(1, toInt(raw.page) ?? 1),
  };
}

async function getProducts(f: Filters, page: number) {
  // Lecture publique : la clé "anon" suffit (la policy RLS autorise le SELECT sur products).
  let query = supabase.from("products").select("*", { count: "exact" });

  if (f.cat) query = query.eq("category", f.cat);
  if (f.brands.length) query = query.in("brand", f.brands);
  if (f.min !== undefined) query = query.gte("price", f.min);
  if (f.max !== undefined) query = query.lte("price", f.max);
  if (f.q) {
    // On retire les caractères qui casseraient la syntaxe du filtre .or() de PostgREST.
    const safe = f.q.replace(/[,()%_\\*]/g, " ").trim();
    if (safe) query = query.or(`name.ilike.%${safe}%,brand.ilike.%${safe}%`);
  }
  if (f.sort === "discount") query = query.not("compare_at_price", "is", null);

  switch (f.sort) {
    case "price_asc":
      query = query.order("price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false });
      break;
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    default:
      query = query
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });
  }
  // L'id départage les ex æquo : sans lui, un produit pourrait apparaître sur deux pages.
  query = query.order("id", { ascending: true });

  const from = (page - 1) * PAGE_SIZE;
  const { data, error, count } = await query.range(from, from + PAGE_SIZE - 1);

  if (error) {
    console.error("catalogue: lecture des produits impossible", error);
    return { products: [] as Product[], total: 0, failed: true };
  }
  return { products: (data as Product[]) ?? [], total: count ?? 0, failed: false };
}

/** Reconstruit une URL de catalogue à partir des filtres (pour la redirection). */
function buildUrl(f: Filters, page: number) {
  const sp = new URLSearchParams();
  if (f.cat) sp.set("cat", f.cat);
  if (f.q) sp.set("q", f.q);
  if (f.sort) sp.set("sort", f.sort);
  f.brands.forEach((b) => sp.append("brand", b));
  if (f.min !== undefined) sp.set("min", String(f.min));
  if (f.max !== undefined) sp.set("max", String(f.max));
  if (page > 1) sp.set("page", String(page));
  const qs = sp.toString();
  return qs ? `/catalogue?${qs}` : "/catalogue";
}

export default async function CataloguePage({ searchParams }: { searchParams: RawParams }) {
  const filters = parseFilters(searchParams);

  const [{ products, total, failed }, brands] = await Promise.all([
    getProducts(filters, filters.page),
    getBrands(filters.cat || undefined),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  // Page demandée au-delà de la dernière (ex. filtre ajouté depuis la page 5) : on y renvoie.
  if (!failed && total > 0 && filters.page > totalPages) {
    redirect(buildUrl(filters, totalPages));
  }

  const activeCat = CATEGORIES.find((c) => c.value === filters.cat) ?? CATEGORIES[0];
  const firstShown = total === 0 ? 0 : (filters.page - 1) * PAGE_SIZE + 1;
  const lastShown = Math.min(total, filters.page * PAGE_SIZE);
  const hasFilters =
    !!filters.q || filters.brands.length > 0 || filters.min !== undefined || filters.max !== undefined;

  // Re-monte la grille à chaque changement de filtre/page : l'animation d'entrée rejoue.
  const gridKey = buildUrl(filters, filters.page);

  return (
    <div className="mx-auto max-w-7xl px-5 py-10">
      <div className="mb-8">
        <p className="font-mono text-xs uppercase tracking-widest text-cyan-400">Catalogue</p>
        <h1 className="mt-1 font-display text-3xl font-600">
          {filters.q
            ? `Résultats pour "${filters.q}"`
            : activeCat.value === ""
              ? "Tous les produits"
              : activeCat.label}
        </h1>
        {!failed && (
          <p className="mt-1 text-sm text-steel-400">
            {total === 0
              ? "0 produit"
              : total > PAGE_SIZE
                ? `${firstShown}–${lastShown} sur ${total} produits`
                : `${total} produit${total > 1 ? "s" : ""}`}
          </p>
        )}
      </div>

      <CatalogueFilters
        categories={CATEGORIES}
        brands={brands}
        active={{
          cat: filters.cat,
          sort: filters.sort,
          q: filters.q,
          brands: filters.brands,
          min: filters.min !== undefined ? String(filters.min) : "",
          max: filters.max !== undefined ? String(filters.max) : "",
        }}
      />

      <div className="mt-8">
        {failed ? (
          <div
            role="alert"
            className="rounded-xl border border-carbon-700 bg-carbon-900 px-6 py-16 text-center text-steel-300"
          >
            Le catalogue est momentanément indisponible. Réessaie dans quelques minutes.
          </div>
        ) : products.length === 0 && hasFilters ? (
          <div className="rounded-2xl border border-dashed border-carbon-600 px-6 py-16 text-center">
            <p className="text-steel-300">Aucun produit ne correspond à ces critères.</p>
            <Link
              href={filters.cat ? `/catalogue?cat=${filters.cat}` : "/catalogue"}
              className="mt-4 inline-block text-sm text-amber-400 underline-offset-4 hover:underline"
            >
              Retirer les filtres
            </Link>
          </div>
        ) : (
          <Suspense fallback={<div className="py-20 text-center text-steel-400">Chargement...</div>}>
            <ProductGrid key={gridKey} products={products} />
          </Suspense>
        )}
      </div>

      {!failed && (
        <Pagination
          page={filters.page}
          totalPages={totalPages}
          params={{
            cat: filters.cat,
            q: filters.q,
            sort: filters.sort,
            brand: filters.brands,
            min: filters.min !== undefined ? String(filters.min) : undefined,
            max: filters.max !== undefined ? String(filters.max) : undefined,
          }}
        />
      )}
    </div>
  );
}
