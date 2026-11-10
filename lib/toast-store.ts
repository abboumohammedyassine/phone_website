"use client";

import { create } from "zustand";

export type ToastTone = "success" | "error" | "info";
export type Toast = { id: number; message: string; tone: ToastTone };

type ToastState = {
  toasts: Toast[];
  push: (message: string, tone?: ToastTone) => void;
  dismiss: (id: number) => void;
};

let nextId = 1;
const AUTO_DISMISS_MS = 3500;
const MAX_VISIBLE = 3;

export const useToastStore = create<ToastState>()((set, get) => ({
  toasts: [],
  push: (message, tone = "info") => {
    const id = nextId++;
    // On garde au plus 3 notifications : les plus anciennes disparaissent.
    set((s) => ({ toasts: [...s.toasts, { id, message, tone }].slice(-MAX_VISIBLE) }));
    setTimeout(() => get().dismiss(id), tone === "error" ? 6000 : AUTO_DISMISS_MS);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Utilisable partout côté navigateur : toast.success("Ajouté au panier") */
export const toast = {
  success: (message: string) => useToastStore.getState().push(message, "success"),
  error: (message: string) => useToastStore.getState().push(message, "error"),
  info: (message: string) => useToastStore.getState().push(message, "info"),
};
