// Télécharge UNE FOIS les wilayas et communes Yalidine dans data/yalidine-places.json.
// Le site lit ensuite ce fichier au lieu d'appeler l'API Yalidine à chaque visite.
//
// Usage :
//   npm run sync:places            → reprend là où il s'est arrêté (saute les wilayas déjà faites)
//   npm run sync:places -- --force → tout retélécharger depuis zéro
//
// Le script espace ses requêtes (1,5 s) pour rester sous les limites de Yalidine.
// En cas de 429 il s'arrête tout de suite SANS réessayer (réessayer prolonge le blocage) ;
// ce qui est déjà téléchargé est conservé : relancez-le plus tard.

try {
  require("dotenv").config({ path: ".env.local" });
} catch {}

const fs = require("fs");
const path = require("path");

const BASE_URL = (process.env.YALIDINE_BASE_URL || "https://api.yalidine.app/v1").replace(/\/+$/, "");
const OUT_FILE = path.join(__dirname, "..", "data", "yalidine-places.json");
const GAP_MS = Number(process.env.SYNC_GAP_MS) || 1500;
const FORCE = process.argv.includes("--force");

if (!process.env.YALIDINE_API_ID || !process.env.YALIDINE_API_TOKEN) {
  console.error("YALIDINE_API_ID / YALIDINE_API_TOKEN manquants dans .env.local");
  process.exit(1);
}

class RateLimitError extends Error {}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let lastCall = 0;

async function api(p) {
  const wait = lastCall + GAP_MS - Date.now();
  if (wait > 0) await sleep(wait);
  lastCall = Date.now();

  const res = await fetch(`${BASE_URL}${p}`, {
    headers: {
      "X-API-ID": process.env.YALIDINE_API_ID,
      "X-API-TOKEN": process.env.YALIDINE_API_TOKEN,
    },
  });
  if (res.status === 429) {
    throw new RateLimitError(res.headers.get("retry-after") || "inconnu");
  }
  if (!res.ok) throw new Error(`HTTP ${res.status} sur ${p} : ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

async function fetchAll(p) {
  const sep = p.includes("?") ? "&" : "?";
  const out = [];
  for (let page = 1; page <= 30; page++) {
    const data = await api(page === 1 ? p : `${p}${sep}page=${page}`);
    out.push(...(data?.data ?? []));
    if (!data?.has_more) break;
  }
  return out;
}

function load() {
  if (FORCE || !fs.existsSync(OUT_FILE)) return { wilayas: [], communes: {} };
  try {
    const d = JSON.parse(fs.readFileSync(OUT_FILE, "utf8"));
    return { wilayas: d.wilayas ?? [], communes: d.communes ?? {} };
  } catch {
    return { wilayas: [], communes: {} };
  }
}

function save(state) {
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(
    OUT_FILE,
    JSON.stringify({ generatedAt: new Date().toISOString(), ...state }) + "\n"
  );
}

(async () => {
  const state = load();

  try {
    if (!state.wilayas.length) {
      console.log("→ wilayas…");
      const raw = await fetchAll("/wilayas");
      state.wilayas = raw.map((w) => ({
        id: Number(w.id),
        name: w.name,
        zone: w.zone,
        is_deliverable: w.is_deliverable,
      }));
      save(state);
    }
    console.log(`${state.wilayas.length} wilayas.`);

    let done = 0;
    for (const w of state.wilayas) {
      done++;
      if (state.communes[w.id]?.length) {
        console.log(`[${done}/${state.wilayas.length}] ${w.name} : déjà là, ignorée`);
        continue;
      }
      const raw = await fetchAll(`/communes?wilaya_id=${w.id}`);
      state.communes[w.id] = raw.map((c) => ({
        id: Number(c.id),
        name: c.name,
        wilaya_id: Number(c.wilaya_id),
        has_stop_desk: c.has_stop_desk,
        is_deliverable: c.is_deliverable,
      }));
      save(state);
      console.log(`[${done}/${state.wilayas.length}] ${w.name} : ${raw.length} communes`);
    }

    const total = Object.values(state.communes).reduce((n, l) => n + l.length, 0);
    console.log(`\nTerminé : ${state.wilayas.length} wilayas, ${total} communes → data/yalidine-places.json`);
  } catch (err) {
    if (err instanceof RateLimitError) {
      console.error(
        `\nYalidine répond 429 (trop de requêtes). Délai demandé (Retry-After) : ${err.message} s.\n` +
          "Progression sauvegardée. Attendez ce délai (et au moins 30 minutes par prudence) " +
          "SANS rien relancer, puis refaites : npm run sync:places"
      );
    } else {
      console.error("\nÉchec :", err.message);
    }
    process.exit(1);
  }
})();