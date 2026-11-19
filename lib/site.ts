// lib/site.ts
// URL publique du site, définie à UN seul endroit (SEO : metadataBase, sitemap, robots).
//
// Priorité :
//   1. NEXT_PUBLIC_SITE_URL  → le domaine définitif, quand il sera branché sur Vercel
//   2. VERCEL_PROJECT_PRODUCTION_URL → le domaine *.vercel.app, fourni automatiquement par Vercel
//   3. http://localhost:3000 → développement local
//
// Avant : le domaine phonehouse-maghnia.com était écrit en dur, alors qu'il n'est pas encore
// branché. Google et les réseaux sociaux recevaient donc des liens vers un site inexistant.

function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    const withScheme = /^https?:\/\//i.test(explicit) ? explicit : `https://${explicit}`;
    return withScheme.replace(/\/+$/, "");
  }

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel}`;

  return "http://localhost:3000";
}

export const SITE_URL = resolveSiteUrl();
