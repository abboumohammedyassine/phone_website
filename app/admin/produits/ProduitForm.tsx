"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Plus, Trash2, X } from "lucide-react";
import type { Product } from "@/lib/types";
import { compressImage } from "@/lib/image-utils";
import { toast } from "@/lib/toast-store";
import { brandKey, resolveBrand } from "@/lib/brand-utils";

const MAX_IMAGES = 10;

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

export default function ProduitForm({
  initialProduct,
  existingBrands = [],
}: {
  initialProduct?: Product;
  /** Marques déjà utilisées dans la boutique (une orthographe par marque). */
  existingBrands?: string[];
}) {
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
  const [images, setImages] = useState<string[]>(initialProduct?.images ?? []);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  function moveImage(index: number, direction: -1 | 1) {
    setImages((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // permet de re-sélectionner le même fichier ensuite
    if (!files.length) return;

    const room = MAX_IMAGES - images.length;
    if (room <= 0) {
      toast.error(`${MAX_IMAGES} images maximum.`);
      return;
    }
    const batch = files.slice(0, room);
    if (files.length > room) toast.info(`Seules ${room} image(s) ont été retenues (maximum ${MAX_IMAGES}).`);

    setUploading(true);
    setError(null);
    const uploaded: string[] = [];

    for (let i = 0; i < batch.length; i++) {
      setUploadProgress(`${i + 1}/${batch.length}`);
      try {
        const prepared = await compressImage(batch[i]);
        const body = new FormData();
        body.append("file", prepared);
        const res = await fetch("/api/admin/upload", { method: "POST", body });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Envoi impossible.");
        uploaded.push(data.url as string);
      } catch (err: any) {
        toast.error(`${batch[i].name} : ${err.message ?? "échec de l'envoi"}`);
      }
    }

    if (uploaded.length) {
      setImages((prev) => [...prev, ...uploaded]);
      toast.success(uploaded.length > 1 ? `${uploaded.length} images ajoutées` : "Image ajoutée");
    }
    setUploading(false);
    setUploadProgress("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (images.length === 0) {
      setError("Ajoute au moins une image du produit.");
      return;
    }
    if (uploading) {
      setError("Attends la fin de l'envoi des images.");
      return;
    }

    setLoading(true);

    const specs = Object.fromEntries(
      specRows.filter((r) => r.key.trim()).map((r) => [r.key.trim(), r.value.trim()])
    );

    const payload = {
      name,
      slug,
      brand: resolveBrand(brand, existingBrands),
      category,
      price: Number(price),
      compare_at_price: compareAtPrice ? Number(compareAtPrice) : null,
      stock: Number(stock),
      images,
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

    toast.success(isEdit ? "Produit modifié" : "Produit créé");
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
            onBlur={() => setBrand((b) => resolveBrand(b, existingBrands))}
            placeholder="Apple"
            autoComplete="off"
          />
          {existingBrands.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {existingBrands.map((b) => {
                const active = brandKey(b) === brandKey(brand);
                return (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBrand(b)}
                    className={`rounded-full border px-3 py-1 text-xs transition ${
                      active
                        ? "border-amber-500 bg-amber-500/10 text-amber-400"
                        : "border-carbon-600 text-steel-300 hover:border-amber-500 hover:text-amber-400"
                    }`}
                  >
                    {b}
                  </button>
                );
              })}
            </div>
          )}
          <p className="mt-1.5 text-xs text-steel-400">
            Choisis une marque existante pour ne pas créer de doublon (Samsung / SAMSUNG).
          </p>
        </div>
        <div>
          <label className={labelClass}>Catégorie *</label>
          <select
            required
            className={inputClass}
            value={category}
            onChange={(e) => setCategory(e.target.value as Product["category"])}
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
        <label className={labelClass}>
          Images * <span className="normal-case text-steel-400">(la première est l&apos;image principale)</span>
        </label>

        {images.length > 0 && (
          <ul className="mb-3 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
            {images.map((url, i) => (
              <li
                key={`${url}-${i}`}
                className="relative overflow-hidden rounded-lg border border-carbon-600 bg-white"
              >
                <img src={url} alt={`Image ${i + 1}`} className="aspect-square w-full object-contain" />
                {i === 0 && (
                  <span className="absolute left-1 top-1 rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-medium text-carbon-950">
                    Principale
                  </span>
                )}
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-carbon-950/85 p-1">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => moveImage(i, -1)}
                      disabled={i === 0}
                      aria-label="Déplacer vers le début"
                      className="rounded p-1 text-steel-300 hover:bg-carbon-700 disabled:opacity-30"
                    >
                      <ArrowLeft size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveImage(i, 1)}
                      disabled={i === images.length - 1}
                      aria-label="Déplacer vers la fin"
                      className="rounded p-1 text-steel-300 hover:bg-carbon-700 disabled:opacity-30"
                    >
                      <ArrowRight size={14} />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    aria-label="Retirer cette image"
                    className="rounded p-1 text-red-400 hover:bg-carbon-700"
                  >
                    <X size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={handleFiles}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || images.length >= MAX_IMAGES}
            className="flex items-center gap-2 rounded-lg border border-dashed border-amber-500/60 px-4 py-2.5 text-sm text-amber-400 transition hover:bg-amber-500/10 disabled:opacity-50"
          >
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
            {uploading ? `Envoi en cours (${uploadProgress})…` : "Ajouter des photos"}
          </button>
          <span className="text-xs text-steel-400">
            JPEG, PNG ou WebP · redimensionnées automatiquement · {images.length}/{MAX_IMAGES}
          </span>
        </div>

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
