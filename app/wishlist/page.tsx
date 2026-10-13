"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { useWishlistStore } from "@/lib/wishlist-store";
import { formatDZD } from "@/lib/utils";

export default function WishlistPage() {
  const items = useWishlistStore((s) => s.items);
  const remove = useWishlistStore((s) => s.remove);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-5 py-24 text-center">
        <Heart className="mx-auto text-steel-500" size={40} />
        <h1 className="mt-4 font-display text-xl font-600">
          Aucun favori pour le moment
        </h1>
        <p className="mt-2 text-sm text-steel-400">
          Clique sur le cœur d&apos;un produit pour l&apos;ajouter ici.
        </p>
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
      <h1 className="font-display text-2xl font-600">
        Mes favoris <span className="text-steel-400">({items.length})</span>
      </h1>

      <div className="mt-8 divide-y divide-carbon-700 rounded-xl border border-carbon-700">
        {items.map((item) => (
          <div key={item.productId} className="flex items-center gap-4 p-4">
            <Link
              href={`/produit/${item.slug}`}
              className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-carbon-700 bg-carbon-900"
            >
              {item.image && (
                <Image src={item.image} alt={item.name} fill className="object-contain p-1.5" />
              )}
            </Link>

            <div className="flex-1 min-w-0">
              <Link
                href={`/produit/${item.slug}`}
                className="line-clamp-1 text-sm font-medium hover:text-amber-400"
              >
                {item.name}
              </Link>
              <p className="mt-1 font-display text-sm font-600">
                {formatDZD(item.price)}
              </p>
            </div>

            <Link
              href={`/produit/${item.slug}`}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500 text-carbon-950 transition hover:scale-105"
              aria-label="Voir le produit"
            >
              <ShoppingCart size={15} />
            </Link>

            <button
              onClick={() => remove(item.productId)}
              aria-label="Retirer des favoris"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-steel-400 transition hover:bg-red-500/10 hover:text-red-400"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
