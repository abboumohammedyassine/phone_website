"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import type { Product } from "@/lib/types";

const CATEGORIES = [
  { value: "telephones", label: "Téléphones" },
  { value: "pc", label: "PC & Portables" },
  { value: "audio", label: "Audio" },
  { value: "accessoires", label: "Accessoires" },
];

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

type SpecRow = { key: string; value: string };

export default function ProduitForm({ initialProduct }: { initialProduct?: Product }) {
  const router = useRouter();
  const isEdit = !!initialProduct;

  const [name, setName] = useState(initialProduct?.name ?? "");
  const [slug, setSlug] = useState(initialProduct?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [brand, setBrand] = useState(initialProduct?.brand ?? "");
  const [category, setCategory] = useState(initialProduct?.category ?? "telephones");
  const [price, setPrice] = useState(initialProduct?.price?.toString() ?? "");
  const [compareAtPrice, setCompareAtPrice] = useState(
    initialProduct?.compare_at_price?.toString() ?? ""
  );
  const [stock, setStock] = useState(initialProduct?.stock?.toString() ?? "0");
  const [images, setImages] = useState((initialProduct?.images ?? []).join("\n"));
  const [colors, setColors] = useState((initialProduct?.colors ?? []).join(", "));
  const [storageOptions, setStorageOptions] = useState(
    (initialProduct?.storage_options ?? []).join(", ")
  );
  const [description, setDescription] = useState(initialProduct?.description ?? "");
  const [isFeatured, setIsFeatured] = useState(!!initialProduct?.is_featured);
  const [specRows, setSpecRows] = useState<SpecRow[]>(() => {
    const specs = (initialProduct?.specs as Record<string, string>) ?? {};
    const rows = Object.entries(specs).map(([key, value]) => ({ key, value }));
    return rows.length ? rows : [{ key: "", value: "" }];
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  function updateSpecRow(index: number, field: "key" | "value", value: string) {
    setSpecRows((rows) =>
      rows.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  }

  function addSpecRow() {
    setSpecRows((rows) => [...rows, { key: "", value: "" }]);
  }

  function removeSpecRow(index: number) {
    setSpecRows((rows) => rows.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const specs = Object.fromEntries(
      specRows.filter((r) => r.key.trim()).map((r) => [r.key.trim(), r.value.trim()])
    );

    const payload = {
      name,
      slug,
      brand,
      category,
      price: Number(price),
      compare_at_price: compareAtPrice ? Number(compareAtPrice) : null,
      stock: Number(stock),
      images: images.split("\n").map((s) => s.trim()).filter(Boolean),
      colors: colors.split(",").map((s) => s.trim()).filter(Boolean),
      storage_options: storageOptions.split(",").map((s) => s.trim()).filter(Boolean),
      specs,
      description,
      is_featured: isFeatured,
    };

    const url = isEdit ? `/api/admin/produits/${initialProduct!.id}` : "/api/admin/produits";
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Une erreur est survenue.");
      setLoading(false);
      return;
    }

    router.push("/admin/produits");
    router.refresh();
  }

  const inputClass =
    "w-full rounded-lg border border-carbon-600 bg-carbon-900 px-4 py-2.5 text-sm outline-none focus:border-amber-500";
  const labelClass = "mb-1.5 block text-xs font-medium uppercase tracking-wide text-steel-400";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-16">
      {error && (
        <p className="rounded-lg border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Nom du produit *</label>
          <input
            required
            className={inputClass}
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="iPhone 15 128 Go"
          />
        </div>
        <div>
          <label className={labelClass}>Slug (URL) *</label>
          <input
            required
            className={inputClass}
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            placeholder="iphone-15-128go"
          />
        </div>
        <div>
          <label className={labelClass}>Marque *</label>
          <input
            required
            className={inputClass}
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="Apple"
          />
        </div>
        <div>
          <label className={labelClass}>Catégorie *</label>
          <select
            required
            className={inputClass}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Prix (DA) *</label>
          <input
            required
            type="number"
            min={0}
            className={inputClass}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="185000"
          />
        </div>
        <div>
          <label className={labelClass}>Prix barré / avant solde (DA)</label>
          <input
            type="number"
            min={0}
            className={inputClass}
            value={compareAtPrice}
            onChange={(e) => setCompareAtPrice(e.target.value)}
            placeholder="Laisser vide si pas de promo"
          />
        </div>
        <div>
          <label className={labelClass}>Stock *</label>
          <input
            required
            type="number"
            min={0}
            className={inputClass}
            value={stock}
            onChange={(e) => setStock(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 pt-6">
          <input
            id="featured"
            type="checkbox"
            checked={isFeatured}
            onChange={(e) => setIsFeatured(e.target.checked)}
            className="h-4 w-4 rounded border-carbon-600 bg-carbon-900 accent-amber-500"
          />
          <label htmlFor="featured" className="text-sm text-steel-300">
            Mettre en avant (page d'accueil)
          </label>
        </div>
      </div>

      <div>
        <label className={labelClass}>Images (une URL par ligne) *</label>
        <textarea
          required
          rows={3}
          className={inputClass}
          value={images}
          onChange={(e) => setImages(e.target.value)}
          placeholder={"https://.../photo1.jpg\nhttps://.../photo2.jpg"}
        />
        <p className="mt-1 text-xs text-steel-500">
          Idéalement des images hébergées sur Supabase Storage plutôt que des liens externes.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Couleurs (séparées par des virgules)</label>
          <input
            className={inputClass}
            value={colors}
            onChange={(e) => setColors(e.target.value)}
            placeholder="Noir, Bleu, Rose"
          />
        </div>
        <div>
          <label className={labelClass}>Options de stockage (séparées par des virgules)</label>
          <input
            className={inputClass}
            value={storageOptions}
            onChange={(e) => setStorageOptions(e.target.value)}
            placeholder="128 Go, 256 Go"
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Caractéristiques techniques</label>
        <div className="space-y-2">
          {specRows.map((row, i) => (
            <div key={i} className="flex gap-2">
              <input
                className={inputClass}
                placeholder="Écran"
                value={row.key}
                onChange={(e) => updateSpecRow(i, "key", e.target.value)}
              />
              <input
                className={inputClass}
                placeholder='6.1" OLED'
                value={row.value}
                onChange={(e) => updateSpecRow(i, "value", e.target.value)}
              />
              <button
                type="button"
                onClick={() => removeSpecRow(i)}
                className="shrink-0 rounded-lg border border-carbon-600 px-3 text-steel-400 hover:border-red-800 hover:text-red-400"
                aria-label="Supprimer cette caractéristique"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addSpecRow}
          className="mt-2 flex items-center gap-1.5 text-sm text-amber-500 hover:text-amber-400"
        >
          <Plus size={15} /> Ajouter une caractéristique
        </button>
      </div>

      <div>
        <label className={labelClass}>Description</label>
        <textarea
          rows={4}
          className={inputClass}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 rounded-full bg-amber-500 px-6 py-3 text-sm font-medium text-carbon-950 transition hover:bg-amber-400 disabled:opacity-50"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {isEdit ? "Enregistrer les modifications" : "Créer le produit"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/produits")}
          className="rounded-full border border-carbon-600 px-6 py-3 text-sm text-steel-300 hover:border-carbon-500"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
