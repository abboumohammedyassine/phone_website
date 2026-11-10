// lib/rate-limit.ts
// Limiteur de requêtes simple, en mémoire.
//
// ⚠️ Limite connue : sur Vercel chaque instance serverless a sa propre mémoire, donc ce
// limiteur freine les abus ordinaires (scripts naïfs, clics répétés) mais n'est pas une
// protection absolue. Pour un trafic hostile, activer le pare-feu Vercel (WAF) ou Upstash.

import type { NextRequest } from "next/server";

const hits = new Map<string, number[]>();
const MAX_KEYS = 5000;

/** Retourne true si la requête est autorisée, false si la limite est dépassée. */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);

  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }

  recent.push(now);
  hits.set(key, recent);

  // Nettoyage : évite que la table grossisse indéfiniment.
  if (hits.size > MAX_KEYS) {
    for (const [k, times] of hits) {
      if (!times.some((t) => now - t < windowMs)) hits.delete(k);
    }
  }
  return true;
}

/** IP du visiteur (Vercel renseigne x-forwarded-for). */
export function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
