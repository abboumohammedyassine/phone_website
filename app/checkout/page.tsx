"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/cart-store";
import { formatDZD } from "@/lib/utils";
import { Wilaya, Commune, DeliveryType } from "@/lib/types";
import { normalizeDzPhone, PHONE_ERROR } from "@/lib/validation";
import { CONTACT_PHONE_DISPLAY, CONTACT_PHONE_TEL } from "@/lib/contact";
import { Banknote, Truck, Home, Store, Loader2 } from "lucide-react";

const inputClass =
  "w-full rounded-lg border border-carbon-600 bg-carbon-900 px-4 py-3 text-sm outline-none focus:border-amber-500";

type ShippingOptions = { home: number | null; stopdesk: number | null };

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

  // Tarifs de la commune choisie : null = pas encore connus, sinon { home, stopdesk }
  // (chacun vaut null si Yalidine ne propose pas ce mode pour cette commune).
  const [options, setOptions] = useState<ShippingOptions | null>(null);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [switchNotice, setSwitchNotice] = useState<string | null>(null);

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

  /* Frais : on demande les DEUX tarifs dès que la commune est choisie -- */
  useEffect(() => {
    setSwitchNotice(null);
    if (!wilayaId || !communeId) {
      setOptions(null);
      setShippingError(null);
      return;
    }
    let cancelled = false;
    setOptions(null); // jamais de tarif périmé d'une autre commune
    setLoadingShipping(true);
    setShippingError(null);

    fetch("/api/shipping-estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wilaya_id: wilayaId, commune_id: communeId }),
    })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Frais de livraison indisponibles.");
        return d as ShippingOptions;
      })
      .then((d) => {
        if (cancelled) return;
        setOptions({
          home: typeof d.home === "number" ? d.home : null,
          stopdesk: typeof d.stopdesk === "number" ? d.stopdesk : null,
        });
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setOptions(null);
        setShippingError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoadingShipping(false);
      });

    return () => {
      cancelled = true;
    };
  }, [wilayaId, communeId]);

  // Disponibilité de chaque mode pour la commune choisie.
  const homeAvailable = options ? options.home !== null : true;
  const stopdeskAvailable =
    !!communeId && !!selectedCommune?.has_stop_desk && (options ? options.stopdesk !== null : true);

  // Si le mode choisi n'est pas proposé mais l'autre l'est, on bascule et on le dit.
  useEffect(() => {
    if (!options) return;
    if (deliveryType === "home" && options.home === null && stopdeskAvailable) {
      setDeliveryType("stopdesk");
      setSwitchNotice("La livraison à domicile n'est pas proposée vers cette commune : point relais sélectionné.");
    } else if (deliveryType === "stopdesk" && !stopdeskAvailable && options.home !== null) {
      setDeliveryType("home");
      setSwitchNotice("Pas de point relais dans cette commune : livraison à domicile sélectionnée.");
    }
  }, [options, deliveryType, stopdeskAvailable]);

  const noDeliveryAtAll = !!options && options.home === null && !stopdeskAvailable;
  const shippingCost = options ? options[deliveryType] : null;

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

  const modeButton = (type: DeliveryType, enabled: boolean) =>
    `flex flex-col items-start gap-0.5 rounded-lg border px-4 py-3 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${
      deliveryType === type
        ? "border-amber-500 bg-amber-500/10 text-amber-400"
        : enabled
          ? "border-carbon-600 text-steel-300 hover:border-carbon-500"
          : "border-carbon-700 text-steel-400"
    }`;

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
            aria-label="Wilaya"
            value={wilayaId}
            onChange={(e) => {
              setWilayaId(e.target.value ? Number(e.target.value) : "");
              setCommuneId("");
              setDeliveryType("home");
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
            aria-label="Commune"
            value={communeId}
            disabled={!wilayaId || loadingCommunes}
            onChange={(e) => {
              setCommuneId(e.target.value ? Number(e.target.value) : "");
              setDeliveryType("home");
            }}
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
              disabled={!homeAvailable}
              aria-pressed={deliveryType === "home"}
              className={modeButton("home", homeAvailable)}
            >
              <span className="flex items-center gap-2">
                <Home size={16} /> À domicile
              </span>
              <span className="text-xs text-steel-400">
                {options
                  ? options.home !== null
                    ? formatDZD(options.home)
                    : "Indisponible ici"
                  : loadingShipping
                    ? "Calcul…"
                    : "—"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setDeliveryType("stopdesk")}
              disabled={!stopdeskAvailable}
              aria-pressed={deliveryType === "stopdesk"}
              className={modeButton("stopdesk", stopdeskAvailable)}
            >
              <span className="flex items-center gap-2">
                <Store size={16} /> Point relais
              </span>
              <span className="text-xs text-steel-400">
                {!communeId
                  ? "Choisis une commune"
                  : !selectedCommune?.has_stop_desk
                    ? "Aucun point relais ici"
                    : options
                      ? options.stopdesk !== null
                        ? formatDZD(options.stopdesk)
                        : "Indisponible ici"
                      : loadingShipping
                        ? "Calcul…"
                        : "—"}
              </span>
            </button>
          </div>

          {switchNotice && (
            <p className="mt-2 text-xs text-cyan-300" role="status">
              {switchNotice}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-carbon-700 bg-carbon-900 px-4 py-3 text-sm text-steel-300">
          <Banknote size={16} className="shrink-0 text-cyan-400" />
          Paiement en espèces à la livraison — seul mode de paiement disponible.
        </div>

        {noDeliveryAtAll && (
          <div
            role="alert"
            className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200"
          >
            La livraison en ligne n&apos;est pas disponible vers cette commune. Appelle-nous pour
            passer commande :{" "}
            <a href={`tel:${CONTACT_PHONE_TEL}`} className="font-medium underline">
              {CONTACT_PHONE_DISPLAY}
            </a>
            .
          </div>
        )}

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
        {!canSubmit && !submitting && !shippingError && !noDeliveryAtAll && (
          <p className="-mt-3 text-center text-xs text-steel-400">
            {communeId
              ? loadingShipping
                ? "Calcul des frais de livraison…"
                : "Choisis un mode de livraison disponible pour continuer."
              : "Choisis ta wilaya et ta commune pour calculer la livraison."}
          </p>
        )}
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
              <span className="text-steel-400">Calcul…</span>
            ) : shippingCost !== null ? (
              <span>{formatDZD(shippingCost)}</span>
            ) : (
              <span className="text-steel-400">—</span>
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
          {shippingCost === null && !shippingError && !noDeliveryAtAll && (
            <p className="text-xs text-steel-400">
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
