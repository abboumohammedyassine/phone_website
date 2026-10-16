"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem } from "./types";

// Doit rester aligné avec la limite du serveur (orderItemSchema.qty.max).
export const MAX_QTY_PER_LINE = 10;

type CartState = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, color?: string, storage?: string) => void;
  setQty: (productId: string, qty: number, color?: string, storage?: string) => void;
  clear: () => void;
  subtotal: () => number;
};

const keyOf = (i: { productId: string; color?: string; storage?: string }) =>
  `${i.productId}-${i.color ?? ""}-${i.storage ?? ""}`;

/** Quantité bornée entre 1, le stock connu et la limite par ligne. */
const clampQty = (qty: number, stock?: number) =>
  Math.max(1, Math.min(qty, MAX_QTY_PER_LINE, stock ?? MAX_QTY_PER_LINE));

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const items = [...get().items];
        const idx = items.findIndex((i) => keyOf(i) === keyOf(item));
        if (idx >= 0) {
          const stock = item.stock ?? items[idx].stock;
          items[idx] = {
            ...items[idx],
            stock,
            qty: clampQty(items[idx].qty + item.qty, stock),
          };
        } else {
          items.push({ ...item, qty: clampQty(item.qty, item.stock) });
        }
        set({ items });
      },
      removeItem: (productId, color, storage) => {
        set({
          items: get().items.filter(
            (i) => keyOf(i) !== keyOf({ productId, color, storage })
          ),
        });
      },
      setQty: (productId, qty, color, storage) => {
        set({
          items: get().items.map((i) =>
            keyOf(i) === keyOf({ productId, color, storage })
              ? { ...i, qty: clampQty(qty, i.stock) }
              : i
          ),
        });
      },
      clear: () => set({ items: [] }),
      subtotal: () => get().items.reduce((sum, i) => sum + i.price * i.qty, 0),
    }),
    // Clé renommée (ancienne : "techzone-cart").
    { name: "phonehouse-cart" }
  )
);
