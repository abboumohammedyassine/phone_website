"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";

export default function DeleteProductButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function handleDelete() {
    setLoading(true);
    const res = await fetch(`/api/admin/produits/${id}`, { method: "DELETE" });
    setLoading(false);

    if (!res.ok) {
      alert("Échec de la suppression.");
      return;
    }
    router.refresh();
  }

  if (confirming) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-steel-400">Supprimer {name} ?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="rounded-full bg-red-600 px-3 py-1 font-medium text-white hover:bg-red-500 disabled:opacity-50"
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : "Oui"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded-full border border-carbon-600 px-3 py-1 text-steel-300"
        >
          Non
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-steel-400 hover:text-red-400"
      aria-label={`Supprimer ${name}`}
    >
      <Trash2 size={16} />
    </button>
  );
}