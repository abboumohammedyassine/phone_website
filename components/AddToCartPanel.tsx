"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/lib/types";
import { useCartStore } from "@/lib/cart-store";
import { formatDZD } from "@/lib/utils";
import { Truck, Banknote } from "lucide-react";

export default function AddToCartPanel({ product }: { product: Product }) {
  const [color, setColor] = useState(product.colors?.[0]);
  const [storage, setStorage] = useState(product.storage_options?.[0]);
  const [qty, setQty] = useState(1);
  const addItem = useCartStore((s) => s.addItem);
  const router = useRouter();

  const handleAdd = () => {
    addItem({
      productId: product.id,
      name: product.name,
      image: product.images?.[0] ?? "",
      price: product.price,
      color,
      storage,
      qty,
    });
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
          <div className="flex gap-2">
            {product.colors.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
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
          <div className="flex gap-2">
            {product.storage_options.map((s) => (
              <button
                key={s}
                onClick={() => setStorage(s)}
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
            className="px-3 py-2 text-steel-300"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
          >
            −
          </button>
          <span className="w-8 text-center text-sm">{qty}</span>
          <button className="px-3 py-2 text-steel-300" onClick={() => setQty((q) => q + 1)}>
            +
          </button>
        </div>
        <span className="text-sm text-steel-400">
          {product.stock > 0 ? `${product.stock} en stock` : "Rupture de stock"}
        </span>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={handleAdd}
          disabled={product.stock === 0}
          className="flex-1 rounded-full bg-amber-500 py-3 text-sm font-medium text-carbon-950 transition hover:bg-amber-400 disabled:opacity-40"
        >
          Ajouter au panier
        </button>
        <button
          onClick={() => {
            handleAdd();
            router.push("/checkout");
          }}
          disabled={product.stock === 0}
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
    </div>
  );
}
