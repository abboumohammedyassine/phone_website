// Server-only helper for the Yalidine Express API.
// Docs: https://yalidine.app (section "API" du compte pro Yalidine).
// Auth: headers X-API-ID / X-API-TOKEN. Never call this from the browser —
// always go through /app/api/yalidine/* route handlers.

const BASE_URL = process.env.YALIDINE_BASE_URL || "https://api.yalidine.app/v1";

function authHeaders() {
  return {
    "X-API-ID": process.env.YALIDINE_API_ID!,
    "X-API-TOKEN": process.env.YALIDINE_API_TOKEN!,
    "Content-Type": "application/json",
  };
}

async function yalidineFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { ...authHeaders(), ...(init?.headers || {}) },
    // Wilayas/communes barely change — safe to cache for a day.
    next: { revalidate: 60 * 60 * 24 },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Yalidine API error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function getWilayas() {
  const data = await yalidineFetch("/wilayas");
  const all = data.data as {
    id: number;
    name: string;
    zone: number;
    is_deliverable: number | boolean;
  }[];
  // Filtre côté serveur Next.js plutôt que via un paramètre de requête
  // Yalidine (leur endpoint /wilayas n'accepte pas ?is_deliverable=1 en filtre).
  return all.filter((w) => !!w.is_deliverable);
}

export async function getCommunes(wilayaId: number) {
  const data = await yalidineFetch(`/communes?wilaya_id=${wilayaId}`);
  const all = data.data as {
    id: number;
    name: string;
    wilaya_id: number;
    has_stop_desk: boolean;
    is_deliverable: number | boolean;
  }[];
  return all.filter((c) => !!c.is_deliverable);
}

// Estimated shipping fee for a given destination + delivery type.
export async function getShippingFee(params: {
  fromWilayaId: number;
  toWilayaId: number;
  deliveryType: "home" | "stopdesk";
  weightKg?: number;
}) {
  const data = await yalidineFetch(
    `/fees?from_wilaya_id=${params.fromWilayaId}&to_wilaya_id=${params.toWilayaId}`
  );
  const feeRow = data?.per_commune?.[0] ?? data;
  const cost =
    params.deliveryType === "stopdesk"
      ? feeRow?.zone_stopdesk_fee ?? feeRow?.stopdesk_fee ?? 0
      : feeRow?.zone_home_fee ?? feeRow?.home_fee ?? 0;
  return Number(cost) || 0;
}

// Creates a parcel ("colis") in Yalidine with cash-on-delivery amount = order total.
// This is the single call that replaces Stripe/online payment in the checkout flow.
export async function createCodParcel(params: {
  orderId: string;
  fullName: string;
  phone: string;
  fromWilayaId: number;
  toWilayaId: number;
  toCommuneId: number;
  address: string;
  deliveryType: "home" | "stopdesk";
  codAmount: number; // montant à encaisser en espèces à la livraison
  productLabel: string;
  weightKg?: number;
}) {
  const payload = [
    {
      order_id: params.orderId,
      firstname: params.fullName.split(" ")[0] || params.fullName,
      familyname: params.fullName.split(" ").slice(1).join(" ") || "-",
      contact_phone: params.phone,
      address: params.address,
      from_wilaya_id: params.fromWilayaId,
      to_wilaya_id: params.toWilayaId,
      to_commune_id: params.toCommuneId,
      product_list: params.productLabel,
      price: params.codAmount, // = montant COD encaissé par le livreur
      is_stopdesk: params.deliveryType === "stopdesk",
      weight: params.weightKg ?? 1,
      do_insurance: false,
      declared_value: params.codAmount,
      freeshipping: false,
    },
  ];

  const data = await yalidineFetch("/parcels", {
    method: "POST",
    body: JSON.stringify(payload),
    next: undefined,
  });

  // Yalidine renvoie un objet par order_id soumis
  const result = data?.[params.orderId] ?? data;
  return {
    tracking: result?.tracking as string | undefined,
    label_url: result?.label as string | undefined,
    raw: result,
  };
}
