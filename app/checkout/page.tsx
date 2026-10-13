"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/cart-store";
import { formatDZD } from "@/lib/utils";
import { Wilaya, Commune, DeliveryType } from "@/lib/types";
import { Banknote, Truck, Home, Store, Loader2 } from "lucide-react";

export default function CheckoutPage() {
  const { items, subtotal, clear } = useCartStore();
  const router = useRouter();

  const [wilayas, setWilayas] = useState<Wilaya[]>([]);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [wilayaId, setWilayaId] = useState<number | "">("");
  const [communeId, setCommuneId] = useState<number | "">("");
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("home");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [loadingCommunes, setLoadingCommunes] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shippingCost, setShippingCost] = useState<number | null>(null);
  const [loadingShipping, setLoadingShipping] = useState(false);
  useEffect(() => {
    fetch("/api/yalidine/wilayas")
      .then((r) => r.json())
      .then((d) => setWilayas(d.wilayas ?? []))
      .catch(() => setError("Impossible de charger la liste des wilayas."));
  }, []);

  useEffect(() => {
    if (!wilayaId) {
      setCommunes([]);
      return;
    }
    setLoadingCommunes(true);
    fetch(`/api/yalidine/communes?wilaya_id=${wilayaId}`)
      .then((r) => r.json())
      .then((d) => setCommunes(d.communes ?? []))
      .finally(() => setLoadingCommunes(false));
  }, [wilayaId]);
  useEffect(() => {
  if (!wilayaId || !communeId || !deliveryType) {
    setShippingCost(null);
    return;
  }

  setLoadingShipping(true);
  fetch("/api/shipping-estimate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      wilaya_id: wilayaId,
      delivery_type: deliveryType,
    }),
  })
    .then((r) => r.json())
    .then((d) => {
      if (typeof d.shipping_cost === "number") {
        setShippingCost(d.shipping_cost);
      } else {
        setShippingCost(null);
      }
    })
    .catch(() => setShippingCost(null))
    .finally(() => setLoadingShipping(false));
}, [wilayaId, communeId, deliveryType]);
  const selectedCommune = communes.find((c) => c.id === communeId);
  const stopdeskAvailable = !!selectedCommune?.has_stop_desk;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wilayaId || !communeId) {
      setError("Choisis ta wilaya et ta commune.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          phone,
          wilaya_id: wilayaId,
          commune_id: communeId,
          address,
          delivery_type: deliveryType,
          items,
          subtotal: subtotal(),
          shipping_cost: 0,
          total: subtotal(),
          payment_method: "cod",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de la commande.");

      clear();
      const trackingParam = data.order?.yalidine_tracking
        ? `tracking=${data.order.yalidine_tracking}`
        : `pending=1`;
      router.push(`/checkout/confirmation?${trackingParam}`);
    } catch (err: any) {
      setError(err.message ?? "Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!items.length) {
    return (
      <div className="mx-auto max-w-lg px-5 py-24 text-center text-steel-400">
        Ton panier est vide.
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-5 py-12 md:grid-cols-[1.3fr_1fr]">
      <form onSubmit={handleSubmit} className="space-y-6">
        <h1 className="font-display text-2xl font-600">Livraison</h1>

        <div className="grid gap-4 sm:grid-cols-2">
          <input
            required
            placeholder="Nom complet"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="rounded-lg border border-carbon-600 bg-carbon-900 px-4 py-3 text-sm outline-none focus:border-amber-500"
          />
          <input
            required
            placeholder="Téléphone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="rounded-lg border border-carbon-600 bg-carbon-900 px-4 py-3 text-sm outline-none focus:border-amber-500"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <select
            required
            value={wilayaId}
            onChange={(e) => {
              setWilayaId(Number(e.target.value));
              setCommuneId("");
            }}
            className="rounded-lg border border-carbon-600 bg-carbon-900 px-4 py-3 text-sm outline-none focus:border-amber-500"
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
            onChange={(e) => setCommuneId(Number(e.target.value))}
            className="rounded-lg border border-carbon-600 bg-carbon-900 px-4 py-3 text-sm outline-none focus:border-amber-500 disabled:opacity-40"
          >
            <option value="">
              {loadingCommunes ? "Chargement…" : "Commune"}
            </option>
            {communes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <textarea
          required
          placeholder="Adresse précise (rue, repère...)"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-carbon-600 bg-carbon-900 px-4 py-3 text-sm outline-none focus:border-amber-500"
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
          <Banknote size={16} className="text-cyan-400 shrink-0" />
          Paiement en espèces à la livraison — seul mode de paiement disponible.
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
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
      <div key={`${i.productId}-${i.color}-${i.storage}`} className="flex justify-between">
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
        <span>{shippingCost === 0 ? "Gratuit" : formatDZD(shippingCost)}</span>
      ) : (
        <span className="text-steel-500">—</span>
      )}
    </div>

    <div className="flex justify-between border-t border-carbon-700 pt-3 font-display text-lg">
      <span>Total</span>
      <span>
        {shippingCost !== null
          ? formatDZD(subtotal() + shippingCost)
          : formatDZD(subtotal())}
      </span>
    </div>
  </div>

  <div className="mt-4 flex items-center gap-2 rounded-lg border border-carbon-700 bg-carbon-950 px-4 py-3 text-sm text-steel-300">
    <Banknote size={16} className="shrink-0 text-cyan-400" />
    Paiement en espèces à la livraison — aucune carte requise.
  </div>
</aside>
    </div>
  );
}
