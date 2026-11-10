// lib/tracking.ts — logique de la page publique de suivi (testable sans base de données).

import type { OrderStatus } from "@/lib/types";

export type TrackableOrder = {
  id: string;
  status: OrderStatus;
  items: Array<{ name: string; qty: number; price?: number; color?: string; storage?: string }>;
  subtotal: number;
  shipping_cost: number;
  total: number;
  delivery_type: "home" | "stopdesk";
  yalidine_tracking: string | null;
  created_at: string;
};

/**
 * Retrouve une commande à partir du numéro saisi par le client :
 * début de l'identifiant (le numéro court de 8 caractères) OU numéro de suivi Yalidine exact.
 * 6 caractères minimum : sans cela, "a" ou "1" retrouveraient n'importe quelle commande.
 */
export function findOrderByRef<T extends { id: string; yalidine_tracking: string | null }>(
  orders: T[],
  ref: string
): T | null {
  const r = ref.trim().toLowerCase();
  if (r.length < 6) return null;
  return (
    orders.find(
      (o) => o.id.toLowerCase().startsWith(r) || (o.yalidine_tracking ?? "").toLowerCase() === r
    ) ?? null
  );
}

/**
 * Ce que le client peut voir. Volontairement SANS adresse ni téléphone :
 * même avec le bon numéro, on n'expose que le strict nécessaire.
 */
export function toPublicOrder(o: TrackableOrder) {
  return {
    ref: o.id.slice(0, 8),
    status: o.status,
    createdAt: o.created_at,
    deliveryType: o.delivery_type,
    items: o.items.map(({ name, qty, price, color, storage }) => ({
      name,
      qty,
      price: price ?? null,
      color: color ?? null,
      storage: storage ?? null,
    })),
    subtotal: o.subtotal,
    shippingCost: o.shipping_cost,
    total: o.total,
    tracking: o.yalidine_tracking,
  };
}

export type PublicOrder = ReturnType<typeof toPublicOrder>;
