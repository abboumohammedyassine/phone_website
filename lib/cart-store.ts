"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem } from "./types";

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

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const items = [...get().items];
        const idx = items.findIndex((i) => keyOf(i) === keyOf(item));
        if (idx >= 0) {
          items[idx] = { ...items[idx], qty: items[idx].qty + item.qty };
        } else {
          items.push(item);
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
              ? { ...i, qty: Math.max(1, qty) }
              : i
          ),
        });
      },
      clear: () => set({ items: [] }),
      subtotal: () => get().items.reduce((sum, i) => sum + i.price * i.qty, 0),
    }),
    { name: "techzone-cart" }
  )
);
