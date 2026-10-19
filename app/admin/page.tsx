import { supabaseAdmin } from "@/lib/supabase";
import { getCommunes, getWilayas } from "@/lib/yalidine";
import OrdersTable from "@/components/admin/OrdersTable";
import type { AdminOrder } from "@/lib/types";

export const dynamic = "force-dynamic";

const ORDERS_LIMIT = 100;

/**
 * Noms des wilayas / communes pour l'affichage. Les ids seuls ne parlent à personne.
 * Si Yalidine ne répond pas, on renvoie des tables vides : l'admin affiche alors
 * "Wilaya n°13" au lieu de planter.
 */
async function loadPlaceNames(orders: AdminOrder[]) {
  const wilayaNames: Record<number, string> = {};
  const communeNames: Record<number, string> = {};
  if (orders.length === 0) return { wilayaNames, communeNames };

  const wilayaIds = [...new Set(orders.map((o) => o.wilaya_id))];

  const [wilayas, communesPerWilaya] = await Promise.all([
    getWilayas().catch(() => []),
    Promise.all(wilayaIds.map((id) => getCommunes(id).catch(() => []))),
  ]);

  for (const w of wilayas) wilayaNames[w.id] = w.name;
  for (const list of communesPerWilaya) {
    for (const c of list) communeNames[c.id] = c.name;
  }
  return { wilayaNames, communeNames };
}

export default async function AdminPage() {
  const { data, error } = await supabaseAdmin()
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(ORDERS_LIMIT);

  if (error) console.error("orders list failed", error);

  const orders = (data ?? []) as AdminOrder[];
  const { wilayaNames, communeNames } = await loadPlaceNames(orders);

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <h1 className="font-display text-2xl font-600">Commandes</h1>
      <p className="mt-1 text-sm text-steel-400">
        Toutes les commandes sont en paiement à la livraison (Yalidine COD). Les {ORDERS_LIMIT}{" "}
        plus récentes sont affichées.
      </p>

      {error ? (
        <div
          role="alert"
          className="mt-6 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          Impossible de charger les commandes. Recharge la page ; si le problème persiste,
          vérifie la connexion à Supabase.
        </div>
      ) : (
        <OrdersTable
          initialOrders={orders}
          wilayaNames={wilayaNames}
          communeNames={communeNames}
        />
      )}
    </div>
  );
}