import { supabaseServer } from "@/lib/supabase-server";
import { isAdminEmail } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

// À appeler en tout premier dans chaque route /api/admin/*.
// Renvoie une NextResponse d'erreur si l'appelant n'est pas admin,
// ou null si tout est bon (on peut continuer le traitement).
export async function requireAdmin() {
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  return null;
}
