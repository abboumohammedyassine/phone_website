"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";

export type ActiveFilters = {
  cat: string;
  sort: string;
  q: string;
  brands: string[];
  min: string;
  max: string;
};

interface Props {
  categories: { value: string; label: string }[];
  /** Marques disponibles dans la catégorie affichée. */
  brands: string[];
  active: ActiveFilters;
}

const SORTS = [
  { value: "", label: "Pertinence" },
  { value: "newest", label: "Plus récents" },
  { value: "price_asc", label: "Prix croissant" },
  { value: "price_desc", label: "Prix décroissant" },
  { value: "discount", label: "En promo" },
];

export default function CatalogueFilters({ categories, brands, active }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [q, setQ] = useState(active.q);
  const [min, setMin] = useState(active.min);
  const [max, setMax] = useState(active.max);
  const [panelOpen, setPanelOpen] = useState(
    active.brands.length > 0 || !!active.min || !!active.max
  );

  const hasAdvanced = active.brands.length > 0 || !!active.min || !!active.max;
  const hasAnyFilter = hasAdvanced || !!active.q || !!active.cat || !!active.sort;
  const advancedCount = active.brands.length + (active.min || active.max ? 1 : 0);

  /** Applique un changement de filtre. La pagination repart toujours de la page 1. */
  function navigate(overrides: Partial<ActiveFilters>) {
    const next = { ...active, ...overrides };
    const sp = new URLSearchParams();
    if (next.cat) sp.set("cat", next.cat);
    if (next.q.trim()) sp.set("q", next.q.trim());
    if (next.sort) sp.set("sort", next.sort);
    next.brands.forEach((b) => sp.append("brand", b));
    if (next.min) sp.set("min", next.min);
    if (next.max) sp.set("max", next.max);
    const qs = sp.toString();
    startTransition(() => router.push(qs ? `/catalogue?${qs}` : "/catalogue", { scroll: false }));
  }

  function toggleBrand(brand: string) {
    const brands = active.brands.includes(brand)
      ? active.brands.filter((b) => b !== brand)
      : [...active.brands, brand];
    navigate({ brands });
  }

  function applyPrice() {
    // Si les bornes sont inversées (min > max), on les remet dans l'ordre.
    let lo = min.trim();
    let hi = max.trim();
    if (lo && hi && Number(lo) > Number(hi)) [lo, hi] = [hi, lo];
    setMin(lo);
    setMax(hi);
    navigate({ min: lo, max: hi });
  }

  function reset() {
    setQ("");
    setMin("");
    setMax("");
    startTransition(() => router.push("/catalogue", { scroll: false }));
  }

  return (
    <div className={`flex flex-col gap-4 transition-opacity ${isPending ? "opacity-60" : ""}`}>
      {/* Recherche */}
      <div className="relative md:max-w-xs">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-steel-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && navigate({ q })}
          placeholder="Rechercher un produit ou une marque…"
          aria-label="Rechercher dans le catalogue"
          className="w-full rounded-xl border border-carbon-600 bg-carbon-900 py-2.5 pl-9 pr-9 text-sm outline-none focus:border-amber-500"
        />
        {q && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              navigate({ q: "" });
            }}
            aria-label="Effacer la recherche"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-steel-400 hover:text-porcelain"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Catégories */}
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              type="button"
              key={c.value}
              // Changer de catégorie réinitialise les marques (elles dépendent de la catégorie).
              onClick={() => navigate({ cat: c.value, brands: [] })}
              aria-pressed={active.cat === c.value}
              className={`rounded-full px-4 py-1.5 text-sm transition ${
                active.cat === c.value
                  ? "bg-amber-500 font-medium text-carbon-950"
                  : "border border-carbon-600 text-steel-300 hover:border-carbon-500 hover:text-porcelain"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPanelOpen((v) => !v)}
            aria-expanded={panelOpen}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm transition ${
              hasAdvanced
                ? "border-amber-500 text-amber-400"
                : "border-carbon-600 text-steel-300 hover:border-carbon-500"
            }`}
          >
            <SlidersHorizontal size={14} />
            Filtres
            {advancedCount > 0 && (
              <span className="rounded-full bg-amber-500 px-1.5 text-xs font-medium text-carbon-950">
                {advancedCount}
              </span>
            )}
          </button>

          <select
            value={active.sort}
            onChange={(e) => navigate({ sort: e.target.value })}
            aria-label="Trier les produits"
            className="rounded-xl border border-carbon-600 bg-carbon-900 px-3 py-1.5 text-sm text-steel-300 outline-none focus:border-amber-500"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Panneau marques + prix */}
      {panelOpen && (
        <div className="grid gap-6 rounded-2xl border border-carbon-700 bg-carbon-900 p-5 md:grid-cols-2">
          <fieldset>
            <legend className="mb-3 text-xs font-medium uppercase tracking-wide text-steel-400">
              Marque
            </legend>
            {brands.length === 0 ? (
              <p className="text-sm text-steel-400">Aucune marque disponible.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {brands.map((b) => {
                  const checked = active.brands.includes(b);
                  return (
                    <label
                      key={b}
                      className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${
                        checked
                          ? "border-amber-500 bg-amber-500/10 text-amber-400"
                          : "border-carbon-600 text-steel-300 hover:border-carbon-500"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleBrand(b)}
                        className="sr-only"
                      />
                      {b}
                    </label>
                  );
                })}
              </div>
            )}
          </fieldset>

          <fieldset>
            <legend className="mb-3 text-xs font-medium uppercase tracking-wide text-steel-400">
              Prix (DA)
            </legend>
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={min}
                onChange={(e) => setMin(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyPrice()}
                placeholder="Min"
                aria-label="Prix minimum"
                className="w-full rounded-lg border border-carbon-600 bg-carbon-950 px-3 py-2 text-sm outline-none focus:border-amber-500"
              />
              <span className="text-steel-400">—</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={max}
                onChange={(e) => setMax(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyPrice()}
                placeholder="Max"
                aria-label="Prix maximum"
                className="w-full rounded-lg border border-carbon-600 bg-carbon-950 px-3 py-2 text-sm outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={applyPrice}
                className="shrink-0 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-carbon-950 transition hover:bg-amber-400"
              >
                Appliquer
              </button>
            </div>
          </fieldset>
        </div>
      )}

      {hasAnyFilter && (
        <button
          type="button"
          onClick={reset}
          className="flex w-fit items-center gap-1.5 text-sm text-steel-300 underline-offset-4 transition hover:text-amber-400 hover:underline"
        >
          <X size={13} /> Réinitialiser les filtres
        </button>
      )}
    </div>
  );
}
