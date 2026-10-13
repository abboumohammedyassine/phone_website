"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "pending", label: "En attente" },
  { value: "confirmed", label: "Confirmée" },
  { value: "shipped", label: "Expédiée" },
  { value: "delivered", label: "Livrée" },
  { value: "cancelled", label: "Annulée" },
] as const;

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
}: {
  orderId: string;
  initialStatus: string;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleChange(newStatus: string) {
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
      } catch (e: any) {
        setStatus(previous);
        setError(e.message ?? "Erreur");
      }
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      <select
        value={status}
        disabled={isPending}
        onChange={(e) => handleChange(e.target.value)}
        className={`rounded-full border bg-carbon-950 px-2 py-1 text-xs capitalize outline-none focus:border-amber-500 disabled:opacity-60 ${STATUS_STYLES[status] ?? "border-carbon-600 text-steel-300"}`}
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-carbon-900 text-porcelain">
            {opt.label}
          </option>
        ))}
      </select>
      {isPending && <Loader2 size={13} className="animate-spin text-steel-400" />}
      {!isPending && saved && <Check size={13} className="text-green-400" />}
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
