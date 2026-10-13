// create-admin.mjs
// Usage: node create-admin.mjs
// Nécessite: npm install @supabase/supabase-js (déjà présent dans ton projet Next.js)
// Lance ce script DANS ton dossier ecommerce_phone (là où se trouve .env.local et node_modules)

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import WebSocket from "ws";

// Polyfill nécessaire sur Node 20 (WebSocket natif seulement à partir de Node 22)
globalThis.WebSocket = WebSocket;

// Charge .env.local manuellement (pas besoin de dotenv)
const envFile = readFileSync(".env.local", "utf-8");
const env = Object.fromEntries(
  envFile
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const idx = l.indexOf("=");
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    })
);

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

const EMAIL = "yabbou315@gmail.com"; // <-- change si besoin
const PASSWORD = "Admin2026!";       // <-- change pour ton propre mot de passe

const { data, error } = await supabase.auth.admin.createUser({
  email: EMAIL,
  password: PASSWORD,
  email_confirm: true, // équivalent de "Auto confirm user"
});

if (error) {
  console.error("❌ Échec de la création :", error.message, error);
} else {
  console.log("✅ Utilisateur créé avec succès :");
  console.log("   id:", data.user.id);
  console.log("   email:", data.user.email);
}
