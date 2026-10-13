import { createBrowserClient } from "@supabase/ssr";

// Public client — safe for the browser (anon key, protected by RLS).
// Uses cookies (not localStorage) so the session is visible to
// middleware.ts and server components via lib/supabase-server.ts.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Server-only client with elevated rights — NEVER import this from a
// client component, only from route handlers / server actions.
import { createClient } from "@supabase/supabase-js";

export function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}