"use client";

import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/lib/cart-store";
import { formatDZD } from "@/lib/utils";
import { Trash2 } from "lucide-react";

export default function CartPage() {
  const { items, removeItem, setQty, subtotal } = useCartStore();

  if (!items.length) {
    return (
      <div className="mx-auto max-w-lg px-5 py-24 text-center">
        <h1 className="font-display text-2xl font-600">Ton panier est vide</h1>
        <p className="mt-2 text-steel-400">Ajoute des produits depuis le catalogue.</p>
        <Link
          href="/catalogue"
          className="mt-6 inline-block rounded-full bg-amber-500 px-6 py-3 text-sm font-medium text-carbon-950"
        >
          Voir le catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      <h1 className="font-display text-3xl font-600">Panier</h1>

      <div className="mt-8 divide-y divide-carbon-700 rounded-xl border border-carbon-700">
        {items.map((item) => (
          <div
            key={`${item.productId}-${item.color}-${item.storage}`}
            className="flex items-center gap-4 p-4"
          >
            <div className="relative h-16 w-16 shrink-0 rounded-lg bg-carbon-800">
              {item.image && (
                <Image src={item.image} alt={item.name} fill className="object-contain p-2" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{item.name}</p>
              <p className="text-xs text-steel-400">
                {[item.color, item.storage].filter(Boolean).join(" · ")}
              </p>
            </div>
            <div className="flex items-center rounded-full border border-carbon-600">
              <button
                className="px-3 py-1 text-steel-300"
                onClick={() =>
                  setQty(item.productId, item.qty - 1, item.color, item.storage)
                }
              >
                −
              </button>
              <span className="w-6 text-center text-sm">{item.qty}</span>
              <button
                className="px-3 py-1 text-steel-300"
                onClick={() =>
                  setQty(item.productId, item.qty + 1, item.color, item.storage)
                }
              >
                +
              </button>
            </div>
            <p className="w-24 text-right font-display text-sm">
              {formatDZD(item.price * item.qty)}
            </p>
            <button
              onClick={() => removeItem(item.productId, item.color, item.storage)}
              className="text-steel-400 hover:text-red-400"
              aria-label="Retirer"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <div>
          <p className="text-sm text-steel-400">Sous-total</p>
          <p className="font-display text-2xl font-600">{formatDZD(subtotal())}</p>
        </div>
        <Link
          href="/checkout"
          className="rounded-full bg-amber-500 px-8 py-3 text-sm font-medium text-carbon-950 transition hover:bg-amber-400"
        >
          Passer commande
        </Link>
      </div>
      <p className="mt-2 text-right text-xs text-steel-400">
        Frais de livraison Yalidine calculés à l'étape suivante.
      </p>
    </div>
  );
}
