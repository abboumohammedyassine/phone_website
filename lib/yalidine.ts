// lib/yalidine.ts
// Helper SERVEUR pour l'API Yalidine Express. Ne jamais importer côté navigateur :
// passer par les route handlers /app/api/*.
// Auth : en-têtes X-API-ID / X-API-TOKEN.
//
// ⚠️ À valider avec les VRAIS identifiants du client (voir le guide de livraison) :
//   1. format de /fees (per_commune)      → test : POST /api/shipping-estimate
//   2. création de colis par NOMS de lieux → test : une commande réelle à petit montant
//   3. montant COD = produits seulement    → vérifier le bordereau Yalidine

import places from "@/data/yalidine-places.json";

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
/* ------------------------------------------------------------------ */
/* Limites Yalidine : 5 requêtes / seconde. On reste très en dessous.  */
/* ------------------------------------------------------------------ */

const MIN_GAP_MS = 300; // ~3 requêtes/s max
const DEFAULT_COOLDOWN_MS = 10 * 60_000; // pause locale après un 429 sans Retry-After
let nextSlot = 0;
let bannedUntil = 0;

async function throttle() {
  const now = Date.now();
  const at = Math.max(now, nextSlot);
  nextSlot = at + MIN_GAP_MS;
  if (at > now) await new Promise((r) => setTimeout(r, at - now));
}

async function yalidineFetch(path: string, init: RequestInit = {}) {
  if (!isYalidineConfigured()) throw new YalidineNotConfiguredError();
  if (Date.now() < bannedUntil) {
    throw new Error("Yalidine API error 429: pause locale active (Retry-After respecté)");
  }
  await throttle();

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
      if (res.status === 429) {
        // On respecte le délai demandé par Yalidine (en-tête Retry-After, en secondes).
        const retry = Number(res.headers.get("retry-after"));
        bannedUntil =
          Date.now() + (Number.isFinite(retry) && retry > 0 ? retry * 1000 : DEFAULT_COOLDOWN_MS);
      }
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

// Wilayas et communes viennent d'abord du fichier data/yalidine-places.json
// (généré par `npm run sync:places`). L'API Yalidine n'est appelée que si ce
// fichier est encore vide : cela évite les erreurs 429 (limite de 5 requêtes/s).
const local = places as unknown as {
  wilayas: RawWilaya[];
  communes: Record<string, RawCommune[]>;
};

async function listWilayas(): Promise<RawWilaya[]> {
  if (local.wilayas?.length) return local.wilayas;
  return fetchAll<RawWilaya>("/wilayas");
}

async function listCommunes(wilayaId: number): Promise<RawCommune[]> {
  const cached = local.communes?.[String(wilayaId)];
  if (cached?.length) return cached;
  return fetchAll<RawCommune>(`/communes?wilaya_id=${wilayaId}`);
}

export async function getWilayas() {
  // Filtre côté Next.js (l'endpoint /wilayas n'accepte pas ?is_deliverable=1).
  return (await listWilayas()).filter((w) => !!w.is_deliverable);
}

export async function getCommunes(wilayaId: number) {
  return (await listCommunes(wilayaId)).filter((c) => !!c.is_deliverable);
}

/** Yalidine crée les colis à partir des NOMS (pas des ids) : on les résout ici. */
async function resolveLocationNames(p: {
  fromWilayaId: number;
  toWilayaId: number;
  toCommuneId: number;
}) {
  const [wilayas, communes] = await Promise.all([
    listWilayas(),
    listCommunes(p.toWilayaId),
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

// La réponse /fees contient les tarifs de TOUTES les communes d'une wilaya :
// on la garde 1 h en mémoire pour ne pas rappeler Yalidine à chaque changement
// de commune ou de mode de livraison. Un échec n'est jamais mémorisé.
const FEES_TTL_MS = 60 * 60_000;
const feesCache = new Map<string, { at: number; promise: Promise<any> }>();

function getFeesCached(fromWilayaId: number, toWilayaId: number): Promise<any> {
  const key = `${fromWilayaId}-${toWilayaId}`;
  const hit = feesCache.get(key);
  if (hit && Date.now() - hit.at < FEES_TTL_MS) return hit.promise;

  const promise = yalidineFetch(
    `/fees?from_wilaya_id=${fromWilayaId}&to_wilaya_id=${toWilayaId}`
  );
  feesCache.set(key, { at: Date.now(), promise });
  promise.catch(() => {
    if (feesCache.get(key)?.promise === promise) feesCache.delete(key);
  });
  return promise;
}

export type ShippingOptions = { home: number | null; stopdesk: number | null };

type FeesQuery = { fromWilayaId: number; toWilayaId: number; communeId?: number };

/** Un tarif valide est un nombre strictement positif ; tout le reste = "indisponible". */
function toFee(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Trouve la ligne de tarif d'une commune (per_commune : objet indexé par id OU tableau). */
function findCommuneRow(per: unknown, communeId?: number): any | null {
  if (communeId === undefined || !per || typeof per !== "object") return null;
  if (Array.isArray(per)) return per.find((r: any) => Number(r?.commune_id) === communeId) ?? null;
  const byKey = (per as Record<string, any>)[String(communeId)];
  if (byKey) return byKey;
  return Object.values(per as Record<string, any>).find((r: any) => Number(r?.commune_id) === communeId) ?? null;
}

/**
 * Tarifs Yalidine d'une commune : domicile ET point relais, en un seul appel.
 * Un tarif absent vaut null (jamais 0) : le checkout peut alors expliquer pourquoi
 * un mode de livraison n'est pas proposé, au lieu de bloquer sans message.
 */
export async function getShippingOptions(params: FeesQuery): Promise<ShippingOptions> {
  const data = await yalidineFetch(
    `/fees?from_wilaya_id=${params.fromWilayaId}&to_wilaya_id=${params.toWilayaId}`
  );

  const per = data?.per_commune;
  const row = findCommuneRow(per, params.communeId);

  // Pas de ligne pour cette commune. On ne devine JAMAIS le tarif d'une autre commune.
  // On n'utilise les champs à la racine que si la réponse n'a pas de per_commune du tout.
  const source = row ?? (per ? null : data);
  if (!source) {
    console.error("Yalidine /fees : commune absente de la réponse", {
      communeId: params.communeId,
      toWilayaId: params.toWilayaId,
      perCommuneType: Array.isArray(per) ? "array" : typeof per,
      sampleKeys: per && typeof per === "object" ? Object.keys(per).slice(0, 5) : [],
      topLevelKeys: data && typeof data === "object" ? Object.keys(data) : [],
    });
    return { home: null, stopdesk: null };
  }

  return {
    home: toFee(source.express_home ?? source.zone_home_fee ?? source.home_fee),
    stopdesk: toFee(source.express_desk ?? source.zone_stopdesk_fee ?? source.stopdesk_fee),
  };
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
 * Options affichées au checkout : Yalidine d'abord, tarif de secours ensuite
 * (seulement pour un mode que Yalidine ne renseigne pas). Si Yalidine est injoignable
 * et qu'aucun secours n'est configuré, lève ShippingUnavailableError.
 */
export async function quoteShippingOptions(params: FeesQuery): Promise<ShippingOptions> {
  let options: ShippingOptions;
  try {
    options = await getShippingOptions(params);
  } catch (err) {
    console.error("Yalidine fee lookup failed:", err);
    const home = fallbackFee("home");
    const stopdesk = fallbackFee("stopdesk");
    if (home === null && stopdesk === null) throw new ShippingUnavailableError();
    return { home, stopdesk };
  }
  return {
    home: options.home ?? fallbackFee("home"),
    stopdesk: options.stopdesk ?? fallbackFee("stopdesk"),
  };
}

/**
 * Frais d'UN mode de livraison, pour la création de commande (même logique que l'estimation,
 * donc le montant facturé est toujours celui affiché). Jamais 0 DA par défaut.
 */
export async function quoteShipping(
  params: FeesQuery & { deliveryType: "home" | "stopdesk" }
): Promise<{ fee: number; source: "yalidine" | "fallback" }> {
  let yalidineFee: number | null = null;
  try {
    const options = await getShippingOptions(params);
    yalidineFee = params.deliveryType === "stopdesk" ? options.stopdesk : options.home;
  } catch (err) {
    console.error("Yalidine fee lookup failed:", err);
  }
  if (yalidineFee !== null) return { fee: yalidineFee, source: "yalidine" };

  const fb = fallbackFee(params.deliveryType);
  if (fb !== null) return { fee: fb, source: "fallback" };
  throw new ShippingUnavailableError();
}

/**
 * Diagnostic (admin uniquement) : ce que Yalidine répond vraiment pour une commune.
 * Ne contient aucun secret : uniquement des tarifs et des noms de lieux.
 */
export async function inspectFees(params: {
  fromWilayaId: number;
  toWilayaId: number;
  communeId?: number;
  communeName?: string;
}) {
  const communes = await fetchAll<RawCommune>(`/communes?wilaya_id=${params.toWilayaId}`);
  const norm = (v: string) =>
    v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const commune =
    communes.find((c) => Number(c.id) === params.communeId) ??
    (params.communeName
      ? communes.find((c) => norm(c.name).includes(norm(params.communeName!)))
      : undefined);

  const data = await yalidineFetch(
    `/fees?from_wilaya_id=${params.fromWilayaId}&to_wilaya_id=${params.toWilayaId}`
  );
  const per = data?.per_commune;
  const row = commune ? findCommuneRow(per, Number(commune.id)) : null;

  return {
    commune: commune
      ? {
          id: commune.id,
          name: commune.name,
          has_stop_desk: !!commune.has_stop_desk,
          is_deliverable: !!commune.is_deliverable,
        }
      : null,
    feesResponse: {
      topLevelKeys: data && typeof data === "object" ? Object.keys(data) : [],
      perCommuneType: Array.isArray(per) ? "array" : typeof per,
      perCommuneCount: per && typeof per === "object" ? Object.keys(per).length : 0,
      sampleKeys: per && typeof per === "object" ? Object.keys(per).slice(0, 5) : [],
    },
    rowForCommune: row,
    parsedOptions: commune ? await getShippingOptions({ ...params, communeId: Number(commune.id) }) : null,
    communesInWilaya: communes.length,
  };
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