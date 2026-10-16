require("dotenv").config({ path: ".env.local" });

if (typeof globalThis.WebSocket === "undefined") {
  globalThis.WebSocket = require("ws");
}

const { createClient } = require("@supabase/supabase-js");

const [, , email, password] = process.argv;

if (!email || !password) {
  console.error('Usage: node scripts/create-admin.js "email" "motdepasse"');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

(async () => {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    console.error("Échec de la création. Détails complets :");
    console.error(JSON.stringify(error, null, 2));
    console.error("status:", error.status);
    console.error("code:", error.code);
    process.exit(1);
  }

  console.log("Utilisateur créé avec succès :");
  console.log("  id:", data.user.id);
  console.log("  email:", data.user.email);
})();
