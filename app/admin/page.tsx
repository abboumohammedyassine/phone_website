import { supabaseAdmin } from "@/lib/supabase";
import { formatDZD } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";
import OrderStatusSelect from "@/components/OrderStatusSelect";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const db = supabaseAdmin();
  const { data: orders } = await db
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  const needsAttention = (orders ?? []).filter(
    (o: any) => !o.yalidine_tracking
  );

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <h1 className="font-display text-2xl font-600">Commandes</h1>
      <p className="mt-1 text-sm text-steel-400">
        Toutes les commandes sont en paiement à la livraison (Yalidine COD).
      </p>

      {needsAttention.length > 0 && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">
              {needsAttention.length} commande{needsAttention.length > 1 ? "s" : ""} sans
              colis Yalidine créé
            </p>
            <p className="mt-0.5 text-red-300/80">
              Le client a payé/commandé, mais l&apos;étiquette de livraison n&apos;a pas
              pu être générée automatiquement (compte Yalidine bloqué, solde
              insuffisant, etc.). Crée ces colis manuellement depuis ton
              tableau de bord Yalidine, ou contacte le client.
            </p>
          </div>
        </div>
      )}

      <div className="mt-8 overflow-x-auto rounded-xl border border-carbon-700">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-carbon-700 bg-carbon-900 text-steel-400">
            <tr>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Wilaya</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Suivi Yalidine</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-carbon-700">
            {(orders ?? []).map((o: any) => (
              <tr key={o.id} className={!o.yalidine_tracking ? "bg-red-500/5" : ""}>
                <td className="px-4 py-3">
                  <p>{o.full_name}</p>
                  <p className="text-xs text-steel-400">{o.phone}</p>
                </td>
                <td className="px-4 py-3">{o.wilaya_id}</td>
                <td className="px-4 py-3">{formatDZD(o.total)}</td>
                <td className="px-4 py-3">
                  <OrderStatusSelect orderId={o.id} initialStatus={o.status} />
                </td>
                <td className="px-4 py-3">
                  {o.yalidine_tracking ? (
                    <span className="font-mono text-xs text-amber-400">
                      {o.yalidine_tracking}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-300">
                      <AlertTriangle size={11} />
                      Colis non créé
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {(!orders || orders.length === 0) && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-steel-400">
                  Aucune commande pour le moment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
