"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  Copy,
  Home,
  Loader2,
  MessageCircle,
  Phone,
  Store,
  X,
} from "lucide-react";
import OrderStatusSelect from "@/components/OrderStatusSelect";
import { formatDZD } from "@/lib/utils";
import type { AdminOrder, OrderStatus } from "@/lib/types";

/** 0555123456 -> "05 55 12 34 56" (les anciens numéros non conformes restent tels quels). */
export function formatPhone(phone: string) {
  return /^\d{10}$/.test(phone) ? phone.replace(/(\d{2})(?=\d)/g, "$1 ") : phone;
}

/** Lien WhatsApp pour un mobile algérien valide (0[567]XXXXXXXX), sinon null. */
export function whatsappLink(phone: string) {
  return /^0[567]\d{8}$/.test(phone) ? `https://wa.me/213${phone.slice(1)}` : null;
}

// Fuseau fixe : évite tout décalage d'affichage entre le serveur (UTC) et le navigateur.
export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    timeZone: "Africa/Algiers",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type Props = {
  order: AdminOrder;
  wilayaName?: string;
  communeName?: string;
  onClose: () => void;
  onChange: (patch: Partial<AdminOrder>) => void;
};

export default function OrderDetailsModal({
  order,
  wilayaName,
  communeName,
  onClose,
  onChange,
}: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [tracking, setTracking] = useState(order.yalidine_tracking ?? "");
  const [savingTracking, setSavingTracking] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [trackingSaved, setTrackingSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const wilaya = wilayaName ?? `Wilaya n°${order.wilaya_id}`;
  const commune = communeName ?? `Commune n°${order.commune_id}`;
  const wa = whatsappLink(order.phone);
  const trackingDirty = tracking.trim() !== (order.yalidine_tracking ?? "");
  const needsParcel =
    !order.yalidine_tracking && order.status !== "cancelled" && order.status !== "delivered";

  /* Échap pour fermer, blocage du scroll de la page, retour du focus ---- */
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  async function saveTracking() {
    setSavingTracking(true);
    setTrackingError(null);
    try {
      const value = tracking.trim();
      const res = await fetch(`/api/admin/commandes/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yalidine_tracking: value }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Enregistrement impossible.");
      }
      onChange({ yalidine_tracking: value || null });
      setTrackingSaved(true);
      setTimeout(() => setTrackingSaved(false), 1500);
    } catch (e: any) {
      setTrackingError(e.message ?? "Erreur");
    } finally {
      setSavingTracking(false);
    }
  }

  /** Toutes les infos utiles pour créer le colis à la main dans l'espace Yalidine. */
  async function copyParcelInfo() {
    const lines = [
      `Client : ${order.full_name}`,
      `Téléphone : ${order.phone}`,
      `Wilaya : ${wilaya}`,
      `Commune : ${commune}`,
      `Adresse : ${order.address}`,
      `Livraison : ${order.delivery_type === "stopdesk" ? "Point relais" : "À domicile"}`,
      `Produits : ${order.items
        .map(
          (i) =>
            `${i.name}${i.color ? ` ${i.color}` : ""}${i.storage ? ` ${i.storage}` : ""} x${i.qty}`
        )
        .join(", ")}`,
      `Montant des produits : ${formatDZD(order.subtotal)}`,
      `Frais de livraison : ${formatDZD(order.shipping_cost)}`,
      `Total payé par le client : ${formatDZD(order.total)}`,
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copie ces informations :", lines.join("\n"));
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-dialog-title"
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-carbon-700 bg-carbon-900 shadow-2xl sm:rounded-2xl"
      >
        {/* En-tête */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-carbon-700 bg-carbon-900 px-5 py-4">
          <div>
            <h2 id="order-dialog-title" className="font-display text-lg font-600">
              Commande de {order.full_name}
            </h2>
            <p className="mt-0.5 font-mono text-xs text-steel-400">
              #{order.id.slice(0, 8)} · {formatDateTime(order.created_at)}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-full p-1.5 text-steel-300 transition hover:bg-carbon-700 hover:text-porcelain"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-6 px-5 py-5">
          {needsParcel && (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2.5 text-sm text-red-300">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <p>
                Aucun colis Yalidine pour cette commande. Crée-le depuis ton espace Yalidine
                (bouton « Copier les infos du colis »), puis colle le numéro de suivi ci-dessous.
              </p>
            </div>
          )}

          {/* Client */}
          <section aria-labelledby="sec-client">
            <h3 id="sec-client" className="mb-2 text-xs uppercase tracking-wide text-steel-400">
              Client
            </h3>
            <p className="text-sm">{order.full_name}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <a
                href={`tel:${order.phone}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-carbon-600 px-3 py-1.5 text-sm text-porcelain transition hover:border-steel-400"
              >
                <Phone size={14} className="text-cyan-400" />
                {formatPhone(order.phone)}
              </a>
              {wa && (
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-green-500/40 px-3 py-1.5 text-sm text-green-300 transition hover:bg-green-500/10"
                >
                  <MessageCircle size={14} />
                  WhatsApp
                </a>
              )}
            </div>
          </section>

          {/* Livraison */}
          <section aria-labelledby="sec-livraison">
            <h3
              id="sec-livraison"
              className="mb-2 text-xs uppercase tracking-wide text-steel-400"
            >
              Livraison
            </h3>
            <p className="inline-flex items-center gap-1.5 rounded-full border border-carbon-600 px-2.5 py-1 text-xs text-steel-300">
              {order.delivery_type === "stopdesk" ? (
                <>
                  <Store size={13} /> Point relais
                </>
              ) : (
                <>
                  <Home size={13} /> À domicile
                </>
              )}
            </p>
            <p className="mt-2 text-sm">
              {commune}, {wilaya}
            </p>
            <p className="mt-0.5 whitespace-pre-line text-sm text-steel-300">{order.address}</p>
          </section>

          {/* Articles */}
          <section aria-labelledby="sec-articles">
            <h3
              id="sec-articles"
              className="mb-2 text-xs uppercase tracking-wide text-steel-400"
            >
              Articles ({order.items.reduce((n, i) => n + i.qty, 0)})
            </h3>
            <ul className="divide-y divide-carbon-700 rounded-xl border border-carbon-700">
              {order.items.map((item, idx) => (
                <li key={`${item.productId}-${idx}`} className="flex items-center gap-3 p-3">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-lg bg-white object-contain"
                    />
                  ) : (
                    <div className="h-12 w-12 shrink-0 rounded-lg bg-carbon-700" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{item.name}</p>
                    <p className="text-xs text-steel-400">
                      {[item.color, item.storage].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p>
                      {formatDZD(item.price)} × {item.qty}
                    </p>
                    <p className="text-xs text-steel-400">{formatDZD(item.price * item.qty)}</p>
                  </div>
                </li>
              ))}
            </ul>

            <dl className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between text-steel-300">
                <dt>Produits</dt>
                <dd>{formatDZD(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between text-steel-300">
                <dt>Livraison</dt>
                <dd>{formatDZD(order.shipping_cost)}</dd>
              </div>
              <div className="flex justify-between border-t border-carbon-700 pt-2 font-display text-base">
                <dt>Total payé par le client à la livraison</dt>
                <dd className="text-amber-400">{formatDZD(order.total)}</dd>
              </div>
            </dl>
          </section>

          {/* Suivi & statut */}
          <section aria-labelledby="sec-suivi" className="space-y-4">
            <h3 id="sec-suivi" className="text-xs uppercase tracking-wide text-steel-400">
              Suivi
            </h3>

            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-steel-300">Statut</span>
              <OrderStatusSelect
                orderId={order.id}
                initialStatus={order.status}
                onChanged={(status: OrderStatus) => onChange({ status })}
              />
            </div>

            <div>
              <label htmlFor="tracking" className="mb-1.5 block text-sm text-steel-300">
                Numéro de suivi Yalidine
              </label>
              <div className="flex gap-2">
                <input
                  id="tracking"
                  value={tracking}
                  onChange={(e) => {
                    setTracking(e.target.value);
                    setTrackingError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && trackingDirty && !savingTracking) saveTracking();
                  }}
                  maxLength={60}
                  placeholder="ex. yal-1A2B3C"
                  className="w-full rounded-lg border border-carbon-600 bg-carbon-950 px-3 py-2 font-mono text-sm outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={saveTracking}
                  disabled={!trackingDirty || savingTracking}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-carbon-950 transition hover:bg-amber-400 disabled:opacity-40"
                >
                  {savingTracking ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : trackingSaved ? (
                    <Check size={14} />
                  ) : null}
                  Enregistrer
                </button>
              </div>
              {trackingError && (
                <p className="mt-1 text-xs text-red-400" role="alert">
                  {trackingError}
                </p>
              )}
            </div>
          </section>

          <button
            type="button"
            onClick={copyParcelInfo}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-carbon-600 py-2.5 text-sm text-porcelain transition hover:border-steel-400"
          >
            {copied ? (
              <>
                <Check size={15} className="text-green-400" /> Copié
              </>
            ) : (
              <>
                <Copy size={15} /> Copier les infos du colis
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
