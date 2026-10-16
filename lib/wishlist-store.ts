"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type WishlistItem = {
  productId: string;
  slug: string;
  name: string;
  image: string;
  price: number;
};

type WishlistState = {
  items: WishlistItem[];
  toggle: (item: WishlistItem) => void;
  remove: (productId: string) => void;
  has: (productId: string) => boolean;
  clear: () => void;
};

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      toggle: (item) => {
        const exists = get().items.some((i) => i.productId === item.productId);
        set({
          items: exists
            ? get().items.filter((i) => i.productId !== item.productId)
            : [...get().items, item],
        });
      },
      remove: (productId) => {
        set({ items: get().items.filter((i) => i.productId !== productId) });
      },
      has: (productId) => get().items.some((i) => i.productId === productId),
      clear: () => set({ items: [] }),
    }),
    { name: "phonehouse-wishlist" }
  )
);