"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2, Lock } from "lucide-react";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Le middleware ajoute ?denied=1 quand le compte est connecté mais absent de ADMIN_EMAILS.
  // (window.location plutôt que useSearchParams : évite d'imposer un <Suspense> à la page.)
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("denied")) {
      setError(
        "Ce compte est bien connecté, mais son email n'est pas autorisé. Ajoute-le dans la variable ADMIN_EMAILS (Vercel), puis redéploie."
      );
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      // On distingue "mauvais identifiants" d'un problème de configuration :
      // avant, une clé Supabase invalide affichait aussi "mot de passe incorrect".
      const msg = (error.message ?? "").toLowerCase();
      if (msg.includes("invalid login credentials")) {
        setError("Email ou mot de passe incorrect.");
      } else if (msg.includes("email not confirmed")) {
        setError("Email non confirmé : confirme-le dans Supabase (Authentication → Users).");
      } else if (msg.includes("api key") || msg.includes("apikey") || error.status === 401) {
        setError(
          "Connexion à Supabase refusée : la clé NEXT_PUBLIC_SUPABASE_ANON_KEY de Vercel est invalide ou périmée."
        );
      } else {
        setError("Connexion impossible pour le moment. Réessaie dans un instant.");
      }
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-5">
      <div className="mb-6 flex items-center gap-2 text-amber-500">
        <Lock size={20} />
        <span className="font-display text-lg font-600">Accès admin</span>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          required
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-carbon-600 bg-carbon-900 px-4 py-3 text-sm outline-none focus:border-amber-500"
        />
        <input
          required
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-carbon-600 bg-carbon-900 px-4 py-3 text-sm outline-none focus:border-amber-500"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-amber-500 py-3 text-sm font-medium text-carbon-950 transition hover:bg-amber-400 disabled:opacity-50"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          Se connecter
        </button>
      </form>
    </div>
  );
}