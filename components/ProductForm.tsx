"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { Product } from "@/lib/types";

const CATEGORIES = [
  { value: "telephones", label: "Téléphones" },
  { value: "pc", label: "PC & Portables" },
  { value: "audio", label: "Audio" },
  { value: "accessoires", label: "Accessoires" },
];

// Représente specs (objet clé/valeur) comme du texte "clé: valeur" par ligne,
// plus simple à éditer à la main qu'un éditeur JSON.
function specsToText(specs?: Record<string, string>) {
  if (!specs) return "";
  return Object.entries(specs)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
}
function textToSpecs(text: string): Record<string, string> {
  const specs: Record<string, string> = {};
  text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .forEach((line) => {
      const idx = line.indexOf(":");
      if (idx === -1) return;
      specs[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
    });
  return specs;
}
function listToText(list?: string[] | null) {
  return (list ?? []).join("\n");
}
function textToList(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

export default function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const isEdit = !!product;

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [brand, setBrand] = useState(product?.brand ?? "");
  const [category, setCategory] = useState<Product["category"]>(
    product?.category ?? "telephones"
  );
  const [price, setPrice] = useState(product?.price?.toString() ?? "");
  const [compareAt, setCompareAt] = useState(
    product?.compare_at_price?.toString() ?? ""
  );
  const [stock, setStock] = useState(product?.stock?.toString() ?? "0");
  const [imagesText, setImagesText] = useState(listToText(product?.images));
  const [colorsText, setColorsText] = useState(listToText(product?.colors));
  const [storageText, setStorageText] = useState(listToText(product?.storage_options));
  const [specsText, setSpecsText] = useState(specsToText(product?.specs));
  const [description, setDescription] = useState(product?.description ?? "");
  const [isFeatured, setIsFeatured] = useState(!!product?.is_featured);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      name,
      slug: slug || undefined,
      brand,
      category,
      price: Number(price),
      compare_at_price: compareAt ? Number(compareAt) : null,
      stock: Number(stock),
      images: textToList(imagesText),
      colors: textToList(colorsText),
      storage_options: textToList(storageText),
      specs: textToSpecs(specsText),
      description,
      is_featured: isFeatured,
    };

    try {
      const res = await fetch(
        isEdit ? `/api/admin/products/${product!.id}` : "/api/admin/products",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de l'enregistrement.");

      router.push("/admin/produits");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!product) return;
    if (!confirm(`Supprimer "${product.name}" ? Cette action est irréversible.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Suppression impossible.");
      router.push("/admin/produits");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setDeleting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-steel-300">Nom</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-carbon-600 bg-carbon-900 px-4 py-2.5 text-sm outline-none focus:border-amber-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-steel-300">
            Slug (URL, auto si vide)
          </label>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="iphone-15-128go"
            className="w-full rounded-lg border border-carbon-600 bg-carbon-900 px-4 py-2.5 text-sm outline-none focus:border-amber-500"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm text-steel-300">Marque</label>
          <input
            required
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="w-full rounded-lg border border-carbon-600 bg-carbon-900 px-4 py-2.5 text-sm outline-none focus:border-amber-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-steel-300">Catégorie</label>
          <select
            value={category}
            onChange={(e) =>
              setCategory(e.target.value as Product["category"])
            }
            className="w-full rounded-lg border border-carbon-600 bg-carbon-900 px-4 py-2.5 text-sm outline-none focus:border-amber-500"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-steel-300">Stock</label>
          <input
            type="number"
            required
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className="w-full rounded-lg border border-carbon-600 bg-carbon-900 px-4 py-2.5 text-sm outline-none focus:border-amber-500"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-steel-300">Prix (DA)</label>
          <input
            type="number"
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full rounded-lg border border-carbon-600 bg-carbon-900 px-4 py-2.5 text-sm outline-none focus:border-amber-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-steel-300">
            Prix barré (optionnel)
          </label>
          <input
            type="number"
            value={compareAt}
            onChange={(e) => setCompareAt(e.target.value)}
            className="w-full rounded-lg border border-carbon-600 bg-carbon-900 px-4 py-2.5 text-sm outline-none focus:border-amber-500"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm text-steel-300">
          Images (une URL par ligne)
        </label>
        <textarea
          rows={2}
          value={imagesText}
          onChange={(e) => setImagesText(e.target.value)}
          placeholder="https://..."
          className="w-full rounded-lg border border-carbon-600 bg-carbon-900 px-4 py-2.5 text-sm outline-none focus:border-amber-500"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-steel-300">
            Couleurs (une par ligne, optionnel)
          </label>
          <textarea
            rows={3}
            value={colorsText}
            onChange={(e) => setColorsText(e.target.value)}
            placeholder="Noir&#10;Bleu"
            className="w-full rounded-lg border border-carbon-600 bg-carbon-900 px-4 py-2.5 text-sm outline-none focus:border-amber-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-steel-300">
            Options de stockage (une par ligne, optionnel)
          </label>
          <textarea
            rows={3}
            value={storageText}
            onChange={(e) => setStorageText(e.target.value)}
            placeholder="128 Go&#10;256 Go"
            className="w-full rounded-lg border border-carbon-600 bg-carbon-900 px-4 py-2.5 text-sm outline-none focus:border-amber-500"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm text-steel-300">
          Caractéristiques (une par ligne, format "clé: valeur")
        </label>
        <textarea
          rows={4}
          value={specsText}
          onChange={(e) => setSpecsText(e.target.value)}
          placeholder={"Écran: 6.1\" OLED\nBatterie: 3349 mAh"}
          className="w-full rounded-lg border border-carbon-600 bg-carbon-900 px-4 py-2.5 text-sm font-mono outline-none focus:border-amber-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-steel-300">Description</label>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-lg border border-carbon-600 bg-carbon-900 px-4 py-2.5 text-sm outline-none focus:border-amber-500"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-steel-300">
        <input
          type="checkbox"
          checked={isFeatured}
          onChange={(e) => setIsFeatured(e.target.checked)}
          className="h-4 w-4 rounded border-carbon-600 bg-carbon-900 accent-amber-500"
        />
        Mettre en avant sur la page d&apos;accueil
      </label>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-full bg-amber-500 px-6 py-3 text-sm font-medium text-carbon-950 transition hover:bg-amber-400 disabled:opacity-50"
        >
          {saving && <Loader2 size={16} className="animate-spin" />}
          {isEdit ? "Enregistrer" : "Créer le produit"}
        </button>

        {isEdit && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 rounded-full border border-red-500/40 px-5 py-3 text-sm text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"
          >
            {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
            Supprimer
          </button>
        )}
      </div>
    </form>
  );
}
