"use client";

import { useEffect, useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import type { OrderStatus } from "@/lib/types";

export const STATUS_OPTIONS: ReadonlyArray<{ value: OrderStatus; label: string }> = [
  { value: "pending", label: "En attente" },
  { value: "confirmed", label: "Confirmée" },
  { value: "shipped", label: "Expédiée" },
  { value: "delivered", label: "Livrée" },
  { value: "cancelled", label: "Annulée" },
];

const STATUS_STYLES: Record<string, string> = {
  pending: "border-carbon-600 text-steel-300",
  confirmed: "border-cyan-500/40 text-cyan-300",
  shipped: "border-amber-500/40 text-amber-300",
  delivered: "border-green-500/40 text-green-300",
  cancelled: "border-red-500/40 text-red-300",
};

export default function OrderStatusSelect({
  orderId,
  initialStatus,
  onChanged,
}: {
  orderId: string;
  initialStatus: OrderStatus;
  /** Appelé après un enregistrement réussi, pour synchroniser la liste et la fenêtre de détail. */
  onChanged?: (status: OrderStatus) => void;
}) {
  const [status, setStatus] = useState<OrderStatus>(initialStatus);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Si le statut change ailleurs (ex. depuis la fenêtre de détail), on se réaligne.
  useEffect(() => setStatus(initialStatus), [initialStatus]);

  function handleChange(newStatus: OrderStatus) {
    const previous = status;
    setStatus(newStatus);
    setError(null);

    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/commandes/${orderId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Échec de la mise à jour");
        }
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
        onChanged?.(newStatus);
      } catch (e: any) {
        setStatus(previous);
        setError(e.message ?? "Erreur");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <select
        value={status}
        disabled={isPending}
        aria-label="Statut de la commande"
        onChange={(e) => handleChange(e.target.value as OrderStatus)}
        className={`rounded-full border bg-carbon-950 px-2 py-1 text-xs outline-none focus:border-amber-500 disabled:opacity-60 ${
          STATUS_STYLES[status] ?? "border-carbon-600 text-steel-300"
        }`}
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-carbon-900 text-porcelain">
            {opt.label}
          </option>
        ))}
      </select>
      {isPending && <Loader2 size={13} className="animate-spin text-steel-400" />}
      {!isPending && saved && <Check size={13} className="text-green-400" />}
      {error && (
        <span className="text-xs text-red-400" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
