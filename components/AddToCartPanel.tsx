"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/lib/types";
import { useCartStore, MAX_QTY_PER_LINE } from "@/lib/cart-store";
import { formatDZD } from "@/lib/utils";
import { toast } from "@/lib/toast-store";
import { Truck, Banknote } from "lucide-react";

export default function AddToCartPanel({ product }: { product: Product }) {
  const [color, setColor] = useState(product.colors?.[0]);
  const [storage, setStorage] = useState(product.storage_options?.[0]);
  const [qty, setQty] = useState(1);
  const addItem = useCartStore((s) => s.addItem);
  const router = useRouter();

  const outOfStock = product.stock <= 0;
  // On ne peut pas dépasser le stock réel, ni la limite par ligne de commande.
  const maxQty = Math.max(1, Math.min(product.stock, MAX_QTY_PER_LINE));

  const handleAdd = (notify = true) => {
    addItem({
      productId: product.id,
      name: product.name,
      image: product.images?.[0] ?? "",
      price: product.price,
      color,
      storage,
      qty,
      stock: product.stock,
    });
    if (notify) toast.success("Ajouté au panier");
  };

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-wide text-steel-400">
        {product.brand}
      </p>
      <h1 className="mt-1 font-display text-3xl font-600">{product.name}</h1>
      <p className="mt-3 font-display text-2xl text-amber-500">
        {formatDZD(product.price)}
      </p>

      {product.colors && product.colors.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 text-sm text-steel-300">Couleur</p>
          <div className="flex flex-wrap gap-2">
            {product.colors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-pressed={color === c}
                className={`rounded-full border px-3 py-1.5 text-sm ${
                  color === c
                    ? "border-amber-500 text-amber-400"
                    : "border-carbon-600 text-steel-300"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {product.storage_options && product.storage_options.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-sm text-steel-300">Stockage</p>
          <div className="flex flex-wrap gap-2">
            {product.storage_options.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStorage(s)}
                aria-pressed={storage === s}
                className={`rounded-full border px-3 py-1.5 text-sm ${
                  storage === s
                    ? "border-amber-500 text-amber-400"
                    : "border-carbon-600 text-steel-300"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 flex items-center gap-3">
        <div className="flex items-center rounded-full border border-carbon-600">
          <button
            type="button"
            aria-label="Diminuer la quantité"
            className="px-3 py-2 text-steel-300 disabled:opacity-30"
            disabled={outOfStock || qty <= 1}
            onClick={() => setQty((q) => Math.max(1, q - 1))}
          >
            −
          </button>
          <span className="w-8 text-center text-sm">{qty}</span>
          <button
            type="button"
            aria-label="Augmenter la quantité"
            className="px-3 py-2 text-steel-300 disabled:opacity-30"
            disabled={outOfStock || qty >= maxQty}
            onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
          >
            +
          </button>
        </div>
        <span className="text-sm text-steel-400">
          {outOfStock ? "Rupture de stock" : `${product.stock} en stock`}
        </span>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={() => handleAdd()}
          disabled={outOfStock}
          className="flex-1 rounded-full bg-amber-500 py-3 text-sm font-medium text-carbon-950 transition hover:bg-amber-400 disabled:opacity-40"
        >
          Ajouter au panier
        </button>
        <button
          type="button"
          onClick={() => {
            handleAdd(false);
            router.push("/checkout");
          }}
          disabled={outOfStock}
          className="flex-1 rounded-full border border-carbon-600 py-3 text-sm text-porcelain transition hover:border-steel-400 disabled:opacity-40"
        >
          Commander maintenant
        </button>
      </div>

      <div className="mt-8 space-y-3 rounded-xl border border-carbon-700 p-4 text-sm text-steel-300">
        <div className="flex items-center gap-2">
          <Truck size={16} className="text-cyan-400" />
          Livraison Yalidine partout en Algérie, 2 à 5 jours
        </div>
        <div className="flex items-center gap-2">
          <Banknote size={16} className="text-cyan-400" />
          Paiement en espèces à la livraison — aucune carte requise
        </div>
      </div>
      {/* Barre fixe mobile */}
<div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-carbon-700 bg-carbon-950/95 px-4 py-3 backdrop-blur md:hidden">
  <div className="min-w-0">
    <p className="truncate text-xs text-steel-400">{product.name}</p>
    <p className="font-display text-lg text-amber-500">{formatDZD(product.price)}</p>
  </div>
  <button
    type="button"
    disabled={outOfStock}
    onClick={() => {
      handleAdd();
      router.push("/checkout");
    }}
    className="ml-auto rounded-full bg-amber-500 px-6 py-3 text-sm font-medium text-carbon-950 disabled:opacity-40"
  >
    {outOfStock ? "Rupture" : "Commander"}
  </button>
</div>
    </div>
  );
}