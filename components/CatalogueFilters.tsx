 "use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, Search, X } from "lucide-react";
import { useState } from "react";

interface Props {
  categories: { value: string; label: string }[];
  activeCat: string;
  activeSort: string;
  activeQ: string;
}

const SORTS = [
  { value: "", label: "Pertinence" },
  { value: "price_asc", label: "Prix croissant" },
  { value: "price_desc", label: "Prix décroissant" },
  { value: "discount", label: "En promo" },
];

export default function CatalogueFilters({ categories, activeCat, activeSort, activeQ }: Props) {
  const router = useRouter();
  const [q, setQ] = useState(activeQ);

  function navigate(params: Record<string, string>) {
    const sp = new URLSearchParams();
    if (activeCat) sp.set("cat", activeCat);
    if (activeSort) sp.set("sort", activeSort);
    if (activeQ) sp.set("q", activeQ);
    Object.entries(params).forEach(([k, v]) => {
      if (v) sp.set(k, v);
      else sp.delete(k);
    });
    router.push(`/catalogue?${sp.toString()}`);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Barre de recherche */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-steel-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && navigate({ q })}
          placeholder="Rechercher dans le catalogue..."
          className="w-full rounded-xl border border-carbon-600 bg-carbon-900 py-2.5 pl-9 pr-9 text-sm outline-none focus:border-amber-500 md:max-w-xs"
        />
        {q && (
          <button
            onClick={() => { setQ(""); navigate({ q: "" }); }}
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
              key={c.value}
              onClick={() => navigate({ cat: c.value })}
              className={`rounded-full px-4 py-1.5 text-sm transition ${
                activeCat === c.value
                  ? "bg-amber-500 text-carbon-950 font-medium"
                  : "border border-carbon-600 text-steel-300 hover:border-carbon-500 hover:text-porcelain"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Tri */}
        <div className="ml-auto flex items-center gap-2">
          <SlidersHorizontal size={14} className="text-steel-400" />
          <select
            value={activeSort}
            onChange={(e) => navigate({ sort: e.target.value })}
            className="rounded-xl border border-carbon-600 bg-carbon-900 px-3 py-1.5 text-sm text-steel-300 outline-none focus:border-amber-500"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
