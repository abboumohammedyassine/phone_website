"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Check, Loader2, PackageSearch, Truck } from "lucide-react";
import { formatDZD } from "@/lib/utils";
import { normalizeDzPhone, PHONE_ERROR } from "@/lib/validation";
import type { PublicOrder } from "@/lib/tracking";

const STEPS = [
  { status: "pending", label: "Reçue" },
  { status: "confirmed", label: "Confirmée" },
  { status: "shipped", label: "Expédiée" },
  { status: "delivered", label: "Livrée" },
] as const;

const STATUS_MESSAGES: Record<string, string> = {
  pending:
    "Ta commande est bien enregistrée. Notre équipe va la confirmer et te contacter au numéro fourni.",
  confirmed: "Ta commande est confirmée et en cours de préparation.",
  shipped: "Ton colis est en route. Tu paieras en espèces à la réception.",
  delivered: "Ta commande a été livrée. Merci pour ta confiance !",
  cancelled: "Cette commande a été annulée.",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    timeZone: "Africa/Algiers",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const inputClass =
  "w-full rounded-lg border border-carbon-600 bg-carbon-900 px-4 py-3 text-sm outline-none focus:border-amber-500";

export default function TrackingForm() {
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [ref, setRef] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<PublicOrder | null>(null);

  // Le lien de la page de confirmation pré-remplit le numéro de commande (?ref=…).
  // (window.location plutôt que useSearchParams : évite d'imposer un <Suspense> à la page.)
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("ref");
    if (fromUrl) setRef(fromUrl.slice(0, 60));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOrder(null);

    const normalized = normalizeDzPhone(phone);
    if (!normalized) {
      setPhoneError(PHONE_ERROR);
      return;
    }
    setPhoneError(null);

    setLoading(true);
    try {
      const res = await fetch("/api/suivi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalized, ref }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Recherche impossible. Réessaie.");
      setOrder(data.order as PublicOrder);
    } catch (err: any) {
      setError(err.message ?? "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  const stepIndex = order ? STEPS.findIndex((s) => s.status === order.status) : -1;

  return (
    <div>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="suivi-phone" className="mb-1.5 block text-sm text-steel-300">
            Téléphone utilisé pour la commande
          </label>
          <input
            id="suivi-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            maxLength={17}
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (phoneError) setPhoneError(null);
            }}
            placeholder="05 55 12 34 56"
            aria-invalid={!!phoneError}
            className={`${inputClass} ${phoneError ? "border-red-500" : ""}`}
          />
          {phoneError && (
            <p className="mt-1 text-xs text-red-400" role="alert">
              {phoneError}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="suivi-ref" className="mb-1.5 block text-sm text-steel-300">
            Numéro de commande ou de suivi
          </label>
          <input
            id="suivi-ref"
            required
            maxLength={60}
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            placeholder="ex. 6742944f"
            className={`${inputClass} font-mono`}
          />
          <p className="mt-1 text-xs text-steel-400">
            Il s&apos;affiche sur la page de confirmation de ta commande.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !phone.trim() || !ref.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-amber-500 py-3 text-sm font-medium text-carbon-950 transition hover:bg-amber-400 disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <PackageSearch size={16} />}
          Suivre ma commande
        </button>
      </form>

      {error && (
        <div
          role="alert"
          className="mt-5 flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {order && (
        <section
          aria-label="Détail de la commande"
          className="mt-6 rounded-2xl border border-carbon-700 bg-carbon-900 p-5"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-lg font-600">Commande #{order.ref}</h2>
            <p className="text-xs text-steel-400">Passée le {formatDate(order.createdAt)}</p>
          </div>

          {order.status === "cancelled" ? (
            <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {STATUS_MESSAGES.cancelled}
            </p>
          ) : (
            <>
              <ol className="mt-5 grid grid-cols-4 gap-2" aria-label="Avancement">
                {STEPS.map((step, i) => {
                  const done = i <= stepIndex;
                  return (
                    <li key={step.status} className="text-center">
                      <div
                        className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full border text-xs ${
                          done
                            ? "border-amber-500 bg-amber-500 text-carbon-950"
                            : "border-carbon-600 text-steel-400"
                        }`}
                      >
                        {done ? <Check size={14} /> : i + 1}
                      </div>
                      <p className={`mt-1.5 text-xs ${done ? "text-porcelain" : "text-steel-400"}`}>
                        {step.label}
                      </p>
                    </li>
                  );
                })}
              </ol>
              <p className="mt-4 text-sm text-steel-300">{STATUS_MESSAGES[order.status]}</p>
            </>
          )}

          {order.tracking && (
            <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-carbon-600 px-3 py-1.5 text-sm">
              <Truck size={14} className="text-cyan-400" />
              Suivi Yalidine : <span className="font-mono text-amber-400">{order.tracking}</span>
            </p>
          )}

          <ul className="mt-5 divide-y divide-carbon-700 border-y border-carbon-700 text-sm">
            {order.items.map((item, i) => (
              <li key={i} className="flex items-start justify-between gap-3 py-2.5">
                <div>
                  <p>{item.name}</p>
                  {(item.color || item.storage) && (
                    <p className="text-xs text-steel-400">
                      {[item.color, item.storage].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
                <p className="shrink-0 text-steel-300">× {item.qty}</p>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-1 text-sm">
            <div className="flex justify-between text-steel-300">
              <dt>Produits</dt>
              <dd>{formatDZD(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between text-steel-300">
              <dt>Livraison ({order.deliveryType === "stopdesk" ? "point relais" : "à domicile"})</dt>
              <dd>{formatDZD(order.shippingCost)}</dd>
            </div>
            <div className="flex justify-between border-t border-carbon-700 pt-2 font-display text-base">
              <dt>À payer à la livraison</dt>
              <dd className="text-amber-400">{formatDZD(order.total)}</dd>
            </div>
          </dl>
        </section>
      )}
    </div>
  );
}
