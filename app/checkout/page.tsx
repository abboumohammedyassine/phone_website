"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/cart-store";
import { formatDZD } from "@/lib/utils";
import { Wilaya, Commune, DeliveryType } from "@/lib/types";
import { normalizeDzPhone, PHONE_ERROR } from "@/lib/validation";
import { Banknote, Truck, Home, Store, Loader2 } from "lucide-react";

const inputClass =
  "w-full rounded-lg border border-carbon-600 bg-carbon-900 px-4 py-3 text-sm outline-none focus:border-amber-500";

export default function CheckoutPage() {
  const { items, subtotal, clear } = useCartStore();
  const router = useRouter();

  // Le panier est lu dans localStorage : on attend l'hydratation pour ne pas
  // afficher "panier vide" une fraction de seconde à chaque chargement.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [wilayas, setWilayas] = useState<Wilaya[]>([]);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [wilayaId, setWilayaId] = useState<number | "">("");
  const [communeId, setCommuneId] = useState<number | "">("");
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("home");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [address, setAddress] = useState("");

  const [loadingCommunes, setLoadingCommunes] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stockProblem, setStockProblem] = useState(false);

  const [shippingCost, setShippingCost] = useState<number | null>(null);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [loadingShipping, setLoadingShipping] = useState(false);

  /* Wilayas ---------------------------------------------------------- */
  useEffect(() => {
    fetch("/api/yalidine/wilayas")
      .then((r) => r.json())
      .then((d) => setWilayas(d.wilayas ?? []))
      .catch(() => setError("Impossible de charger la liste des wilayas."));
  }, []);

  /* Communes --------------------------------------------------------- */
  useEffect(() => {
    if (!wilayaId) {
      setCommunes([]);
      return;
    }
    let cancelled = false;
    setLoadingCommunes(true);
    fetch(`/api/yalidine/communes?wilaya_id=${wilayaId}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setCommunes(d.communes ?? []);
      })
      .catch(() => {
        if (!cancelled) setError("Impossible de charger la liste des communes.");
      })
      .finally(() => {
        if (!cancelled) setLoadingCommunes(false);
      });
    return () => {
      cancelled = true;
    };
  }, [wilayaId]);

  const selectedCommune = communes.find((c) => c.id === communeId);
  const stopdeskAvailable = !!selectedCommune?.has_stop_desk;

  // Si la commune choisie n'a pas de point relais, on repasse en "domicile".
  useEffect(() => {
    if (communeId && selectedCommune && !stopdeskAvailable && deliveryType === "stopdesk") {
      setDeliveryType("home");
    }
  }, [communeId, selectedCommune, stopdeskAvailable, deliveryType]);

  /* Frais de livraison (calculés par le serveur) --------------------- */
  useEffect(() => {
    if (!wilayaId || !communeId) {
      setShippingCost(null);
      setShippingError(null);
      return;
    }
    let cancelled = false;
    setLoadingShipping(true);
    setShippingError(null);

    fetch("/api/shipping-estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wilaya_id: wilayaId,
        commune_id: communeId,
        delivery_type: deliveryType,
      }),
    })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Frais de livraison indisponibles.");
        return d;
      })
      .then((d) => {
        if (cancelled) return;
        setShippingCost(typeof d.shipping_cost === "number" ? d.shipping_cost : null);
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setShippingCost(null);
        setShippingError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoadingShipping(false);
      });

    return () => {
      cancelled = true;
    };
  }, [wilayaId, communeId, deliveryType]);

  /* Validation du téléphone ----------------------------------------- */
  const validatePhone = () => {
    if (!phone.trim()) {
      setPhoneError("Téléphone requis.");
      return null;
    }
    const normalized = normalizeDzPhone(phone);
    setPhoneError(normalized ? null : PHONE_ERROR);
    return normalized;
  };

  /* Envoi ------------------------------------------------------------ */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStockProblem(false);

    if (!wilayaId || !communeId) {
      setError("Choisis ta wilaya et ta commune.");
      return;
    }
    const normalizedPhone = validatePhone();
    if (!normalizedPhone) return;
    if (shippingCost === null) {
      setError("Les frais de livraison ne sont pas encore calculés.");
      return;
    }

    setSubmitting(true);
    try {
      // On n'envoie PAS de prix ni de total : le serveur les recalcule depuis la base.
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          phone: normalizedPhone,
          wilaya_id: wilayaId,
          commune_id: communeId,
          address,
          delivery_type: deliveryType,
          items: items.map((i) => ({
            productId: i.productId,
            color: i.color,
            storage: i.storage,
            qty: i.qty,
          })),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.code === "OUT_OF_STOCK") setStockProblem(true);
        throw new Error(data.error || "Erreur lors de la commande.");
      }

      clear();
      // Numéro de commande court (8 premiers caractères) : sert au suivi sur /suivi.
      const params = new URLSearchParams();
      if (data.order?.id) params.set("ref", String(data.order.id).slice(0, 8));
      if (data.order?.yalidine_tracking) params.set("tracking", data.order.yalidine_tracking);
      else params.set("pending", "1");
      router.push(`/checkout/confirmation?${params.toString()}`);
    } catch (err: any) {
      setError(err.message ?? "Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted) {
    return <div className="mx-auto max-w-5xl px-5 py-24" aria-busy="true" />;
  }

  if (!items.length) {
    return (
      <div className="mx-auto max-w-lg px-5 py-24 text-center text-steel-400">
        Ton panier est vide.
      </div>
    );
  }

  const canSubmit = !submitting && !loadingShipping && shippingCost !== null;

  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-5 py-12 md:grid-cols-[1.3fr_1fr]">
      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <h1 className="font-display text-2xl font-600">Livraison</h1>

        <div className="grid gap-4 sm:grid-cols-2">
          <input
            required
            autoComplete="name"
            placeholder="Nom complet"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={inputClass}
          />
          <div>
            <input
              required
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              maxLength={17}
              placeholder="Téléphone (05 55 12 34 56)"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (phoneError) setPhoneError(null);
              }}
              onBlur={() => phone && validatePhone()}
              aria-invalid={!!phoneError}
              className={`${inputClass} ${phoneError ? "border-red-500" : ""}`}
            />
            {phoneError && (
              <p className="mt-1 text-xs text-red-400" role="alert">
                {phoneError}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <select
            required
            value={wilayaId}
            onChange={(e) => {
              setWilayaId(e.target.value ? Number(e.target.value) : "");
              setCommuneId("");
            }}
            className={inputClass}
          >
            <option value="">Wilaya</option>
            {wilayas.map((w) => (
              <option key={w.id} value={w.id}>
                {w.id} — {w.name}
              </option>
            ))}
          </select>

          <select
            required
            value={communeId}
            disabled={!wilayaId || loadingCommunes}
            onChange={(e) => setCommuneId(e.target.value ? Number(e.target.value) : "")}
            className={`${inputClass} disabled:opacity-40`}
          >
            <option value="">{loadingCommunes ? "Chargement…" : "Commune"}</option>
            {communes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <textarea
          required
          autoComplete="street-address"
          placeholder="Adresse précise (rue, repère...)"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          rows={3}
          className={inputClass}
        />

        <div>
          <p className="mb-2 text-sm text-steel-300">Type de livraison</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setDeliveryType("home")}
              className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
                deliveryType === "home"
                  ? "border-amber-500 bg-amber-500/10 text-amber-400"
                  : "border-carbon-600 text-steel-300"
              }`}
            >
              <Home size={16} /> À domicile
            </button>
            <button
              type="button"
              onClick={() => setDeliveryType("stopdesk")}
              disabled={!stopdeskAvailable}
              className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm disabled:opacity-30 ${
                deliveryType === "stopdesk"
                  ? "border-amber-500 bg-amber-500/10 text-amber-400"
                  : "border-carbon-600 text-steel-300"
              }`}
            >
              <Store size={16} /> Point relais
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-carbon-700 bg-carbon-900 px-4 py-3 text-sm text-steel-300">
          <Banknote size={16} className="shrink-0 text-cyan-400" />
          Paiement en espèces à la livraison — seul mode de paiement disponible.
        </div>

        {error && (
          <div className="text-sm text-red-400" role="alert">
            <p>{error}</p>
            {stockProblem && (
              <Link href="/panier" className="mt-1 inline-block underline">
                Modifier mon panier
              </Link>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-amber-500 py-3 text-sm font-medium text-carbon-950 transition hover:bg-amber-400 disabled:opacity-50"
        >
          {submitting && <Loader2 size={16} className="animate-spin" />}
          Confirmer la commande
        </button>
      </form>

      <aside className="h-fit rounded-xl border border-carbon-700 bg-carbon-900 p-5">
        <h2 className="font-display text-lg font-600">Résumé</h2>

        <div className="mt-4 space-y-2 text-sm">
          {items.map((i) => (
            <div
              key={`${i.productId}-${i.color}-${i.storage}`}
              className="flex justify-between"
            >
              <span className="text-steel-300">
                {i.name} × {i.qty}
              </span>
              <span>{formatDZD(i.price * i.qty)}</span>
            </div>
          ))}

          <div className="my-3 border-t border-carbon-700" />

          <div className="flex justify-between text-steel-300">
            <span>Sous-total</span>
            <span>{formatDZD(subtotal())}</span>
          </div>

          <div className="flex justify-between text-steel-300">
            <span className="flex items-center gap-1.5">
              <Truck size={13} className="text-cyan-400" />
              Livraison
            </span>
            {loadingShipping ? (
              <span className="text-steel-500">Calcul…</span>
            ) : shippingCost !== null ? (
              <span>{formatDZD(shippingCost)}</span>
            ) : (
              <span className="text-steel-500">—</span>
            )}
          </div>

          {shippingError && <p className="text-xs text-red-400">{shippingError}</p>}

          <div className="flex justify-between border-t border-carbon-700 pt-3 font-display text-lg">
            <span>Total</span>
            <span>
              {shippingCost !== null
                ? formatDZD(subtotal() + shippingCost)
                : formatDZD(subtotal())}
            </span>
          </div>
          {shippingCost === null && !shippingError && (
            <p className="text-xs text-steel-500">
              Choisis ta commune pour voir le total avec la livraison.
            </p>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-lg border border-carbon-700 bg-carbon-950 px-4 py-3 text-sm text-steel-300">
          <Banknote size={16} className="shrink-0 text-cyan-400" />
          Paiement en espèces à la livraison — aucune carte requise.
        </div>
      </aside>
    </div>
  );
}