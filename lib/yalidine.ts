// lib/yalidine.ts
// Helper SERVEUR pour l'API Yalidine Express. Ne jamais importer côté navigateur :
// passer par les route handlers /app/api/*.
// Auth : en-têtes X-API-ID / X-API-TOKEN.
//
// ⚠️ À valider avec les VRAIS identifiants du client (voir le guide de livraison) :
//   1. format de /fees (per_commune)      → test : POST /api/shipping-estimate
//   2. création de colis par NOMS de lieux → test : une commande réelle à petit montant
//   3. montant COD = produits seulement    → vérifier le bordereau Yalidine

const BASE_URL = (process.env.YALIDINE_BASE_URL || "https://api.yalidine.app/v1").replace(
  /\/+$/,
  ""
);
const TIMEOUT_MS = 10_000;

export class YalidineNotConfiguredError extends Error {
  constructor() {
    super("Identifiants Yalidine manquants (YALIDINE_API_ID / YALIDINE_API_TOKEN).");
    this.name = "YalidineNotConfiguredError";
  }
}

export class ShippingUnavailableError extends Error {
  constructor() {
    super("Tarif de livraison indisponible pour le moment.");
    this.name = "ShippingUnavailableError";
  }
}

export function isYalidineConfigured() {
  return !!process.env.YALIDINE_API_ID && !!process.env.YALIDINE_API_TOKEN;
}

function authHeaders() {
  return {
    "X-API-ID": process.env.YALIDINE_API_ID!,
    "X-API-TOKEN": process.env.YALIDINE_API_TOKEN!,
    "Content-Type": "application/json",
  };
}

async function yalidineFetch(path: string, init: RequestInit = {}) {
  if (!isYalidineConfigured()) throw new YalidineNotConfiguredError();

  const method = (init.method ?? "GET").toUpperCase();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: { ...authHeaders(), ...(init.headers || {}) },
      // Lieux et tarifs changent rarement : cache 24 h pour les GET.
      // Les écritures (création de colis) ne sont JAMAIS mises en cache.
      ...(method === "GET"
        ? { next: { revalidate: 60 * 60 * 24 } }
        : { cache: "no-store" as const }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Yalidine API error ${res.status}: ${text.slice(0, 300)}`);
    }
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

/** Récupère toutes les pages d'une liste Yalidine (suit `has_more`). */
async function fetchAll<T>(path: string): Promise<T[]> {
  const sep = path.includes("?") ? "&" : "?";
  const out: T[] = [];
  for (let page = 1; page <= 30; page++) {
    const data = await yalidineFetch(page === 1 ? path : `${path}${sep}page=${page}`);
    out.push(...((data?.data ?? []) as T[]));
    if (!data?.has_more) break;
  }
  return out;
}

type RawWilaya = { id: number; name: string; zone: number; is_deliverable: number | boolean };
type RawCommune = {
  id: number;
  name: string;
  wilaya_id: number;
  has_stop_desk: boolean;
  is_deliverable: number | boolean;
};

const listWilayas = () => fetchAll<RawWilaya>("/wilayas");

export async function getWilayas() {
  // Filtre côté Next.js (l'endpoint /wilayas n'accepte pas ?is_deliverable=1).
  return (await listWilayas()).filter((w) => !!w.is_deliverable);
}

export async function getCommunes(wilayaId: number) {
  const all = await fetchAll<RawCommune>(`/communes?wilaya_id=${wilayaId}`);
  return all.filter((c) => !!c.is_deliverable);
}

/** Yalidine crée les colis à partir des NOMS (pas des ids) : on les résout ici. */
async function resolveLocationNames(p: {
  fromWilayaId: number;
  toWilayaId: number;
  toCommuneId: number;
}) {
  const [wilayas, communes] = await Promise.all([
    listWilayas(),
    fetchAll<RawCommune>(`/communes?wilaya_id=${p.toWilayaId}`),
  ]);
  const from = wilayas.find((w) => Number(w.id) === p.fromWilayaId);
  const to = wilayas.find((w) => Number(w.id) === p.toWilayaId);
  const commune = communes.find((c) => Number(c.id) === p.toCommuneId);
  if (!from || !to || !commune) {
    throw new Error("Wilaya ou commune introuvable dans les données Yalidine.");
  }
  return { fromWilaya: from.name, toWilaya: to.name, toCommune: commune.name };
}

/** Point relais : l'id doit venir de /centers, jamais d'une saisie libre. */
async function getStopdeskCenterId(wilayaId: number, communeId: number) {
  const centers = await fetchAll<{ center_id: number; commune_id: number }>(
    `/centers?wilaya_id=${wilayaId}`
  );
  const match = centers.find((c) => Number(c.commune_id) === communeId);
  if (!match) throw new Error("Aucun point relais Yalidine dans cette commune.");
  return Number(match.center_id);
}

/* ------------------------------------------------------------------ */
/* Frais de livraison                                                  */
/* ------------------------------------------------------------------ */

export async function getShippingFee(params: {
  fromWilayaId: number;
  toWilayaId: number;
  communeId?: number;
  deliveryType: "home" | "stopdesk";
}) {
  const data = await yalidineFetch(
    `/fees?from_wilaya_id=${params.fromWilayaId}&to_wilaya_id=${params.toWilayaId}`
  );

  // per_commune peut être un objet indexé par id de commune OU un tableau.
  const per = data?.per_commune;
  let row: any;
  if (Array.isArray(per)) {
    row = per.find((r: any) => Number(r.commune_id) === params.communeId) ?? per[0];
  } else if (per && typeof per === "object") {
    row =
      (params.communeId !== undefined ? per[String(params.communeId)] : undefined) ??
      Object.values(per)[0];
  }
  row = row ?? data;

  const raw =
    params.deliveryType === "stopdesk"
      ? row?.express_desk ?? row?.zone_stopdesk_fee ?? row?.stopdesk_fee
      : row?.express_home ?? row?.zone_home_fee ?? row?.home_fee;

  const fee = Number(raw);
  // On refuse de deviner : un tarif absent ne doit JAMAIS devenir "livraison gratuite".
  if (!Number.isFinite(fee) || fee <= 0) {
    throw new Error("Tarif Yalidine introuvable dans la réponse /fees.");
  }
  return fee;
}

/** Tarif de secours optionnel (variables FALLBACK_SHIPPING_HOME / _STOPDESK). */
function fallbackFee(deliveryType: "home" | "stopdesk"): number | null {
  const raw =
    deliveryType === "stopdesk"
      ? process.env.FALLBACK_SHIPPING_STOPDESK
      : process.env.FALLBACK_SHIPPING_HOME;
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/**
 * Calcule les frais côté serveur : Yalidine d'abord, tarif de secours ensuite
 * (s'il est configuré), sinon erreur explicite — jamais de livraison à 0 DA par défaut.
 */
export async function quoteShipping(params: {
  fromWilayaId: number;
  toWilayaId: number;
  communeId?: number;
  deliveryType: "home" | "stopdesk";
}): Promise<{ fee: number; source: "yalidine" | "fallback" }> {
  try {
    return { fee: await getShippingFee(params), source: "yalidine" };
  } catch (err) {
    console.error("Yalidine fee lookup failed:", err);
    const fb = fallbackFee(params.deliveryType);
    if (fb !== null) return { fee: fb, source: "fallback" };
    throw new ShippingUnavailableError();
  }
}

/* ------------------------------------------------------------------ */
/* Création du colis (COD)                                             */
/* ------------------------------------------------------------------ */

export async function createCodParcel(params: {
  orderId: string;
  fullName: string;
  phone: string;
  fromWilayaId: number;
  toWilayaId: number;
  toCommuneId: number;
  address: string;
  deliveryType: "home" | "stopdesk";
  /** Montant à encaisser = PRODUITS UNIQUEMENT. Yalidine ajoute lui-même les frais
   *  de livraison : envoyer le total (frais inclus) ferait payer la livraison 2 fois. */
  codAmount: number;
  productLabel: string;
  weightKg?: number;
}) {
  const names = await resolveLocationNames(params);
  const stopdeskId =
    params.deliveryType === "stopdesk"
      ? await getStopdeskCenterId(params.toWilayaId, params.toCommuneId)
      : undefined;

  const [firstname, ...rest] = params.fullName.trim().split(/\s+/);

  const payload = [
    {
      order_id: params.orderId,
      from_wilaya_name: names.fromWilaya,
      firstname,
      familyname: rest.join(" ") || "-",
      contact_phone: params.phone,
      address: params.address,
      to_commune_name: names.toCommune,
      to_wilaya_name: names.toWilaya,
      product_list: params.productLabel.slice(0, 250),
      price: params.codAmount,
      do_insurance: false,
      declared_value: params.codAmount,
      weight: params.weightKg ?? 1,
      freeshipping: false,
      is_stopdesk: params.deliveryType === "stopdesk",
      ...(stopdeskId ? { stopdesk_id: stopdeskId } : {}),
      has_exchange: false,
    },
  ];

  const data = await yalidineFetch("/parcels", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  // La réponse est indexée par order_id, et un échec partiel est normal :
  // on vérifie CHAQUE entrée, pas seulement le statut HTTP.
  const result = data?.[params.orderId];
  if (!result || result.success === false || !result.tracking) {
    throw new Error(
      `Yalidine a refusé le colis : ${result?.message ?? JSON.stringify(data).slice(0, 300)}`
    );
  }

  return {
    tracking: result.tracking as string,
    label_url: result.label as string | undefined,
    raw: result,
  };
}
