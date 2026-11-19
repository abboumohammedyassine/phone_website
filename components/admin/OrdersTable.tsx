"use client";

import { useCallback, useMemo, useState } from "react";
import { AlertTriangle, Search } from "lucide-react";
import OrderStatusSelect from "@/components/OrderStatusSelect";
import OrderDetailsModal, { formatDateTime, formatPhone } from "@/components/admin/OrderDetailsModal";
import { formatDZD } from "@/lib/utils";
import type { AdminOrder, OrderStatus } from "@/lib/types";

type Props = {
  initialOrders: AdminOrder[];
  wilayaNames: Record<number, string>;
  communeNames: Record<number, string>;
};

type FilterKey = "all" | "todo" | OrderStatus;

/** Une commande "à traiter" attend encore la création de son colis Yalidine. */
const needsParcel = (o: AdminOrder) =>
  !o.yalidine_tracking && o.status !== "cancelled" && o.status !== "delivered";

const FILTERS: ReadonlyArray<{ key: FilterKey; label: string }> = [
  { key: "all", label: "Toutes" },
  { key: "todo", label: "À traiter" },
  { key: "pending", label: "En attente" },
  { key: "shipped", label: "Expédiées" },
  { key: "delivered", label: "Livrées" },
  { key: "cancelled", label: "Annulées" },
];

function matches(o: AdminOrder, filter: FilterKey) {
  if (filter === "all") return true;
  if (filter === "todo") return needsParcel(o);
  return o.status === filter;
}

export default function OrdersTable({ initialOrders, wilayaNames, communeNames }: Props) {
  const [orders, setOrders] = useState<AdminOrder[]>(initialOrders);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const patchOrder = useCallback((id: string, patch: Partial<AdminOrder>) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  }, []);

  const counts = useMemo(() => {
    const map = {} as Record<FilterKey, number>;
    for (const f of FILTERS) map[f.key] = orders.filter((o) => matches(o, f.key)).length;
    return map;
  }, [orders]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (!matches(o, filter)) return false;
      if (!q) return true;
      return (
        o.full_name.toLowerCase().includes(q) ||
        o.phone.replace(/\s/g, "").includes(q.replace(/\s/g, "")) ||
        (o.yalidine_tracking ?? "").toLowerCase().includes(q) ||
        o.id.toLowerCase().startsWith(q.replace(/^#/, ""))
      );
    });
  }, [orders, filter, query]);

  const todoCount = counts.todo;
  const opened = orders.find((o) => o.id === openId) ?? null;
  const closeModal = useCallback(() => setOpenId(null), []);

  return (
    <>
      {todoCount > 0 && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">
              {todoCount} commande{todoCount > 1 ? "s" : ""} sans colis Yalidine
            </p>
            <p className="mt-0.5 text-red-300/80">
              Le colis n&apos;a pas pu être créé automatiquement (compte Yalidine bloqué, tarif
              indisponible, etc.). Ouvre la commande, copie les infos du colis, crée-le dans ton
              espace Yalidine puis colle le numéro de suivi.
            </p>
          </div>
        </div>
      )}

      {/* Filtres + recherche */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtrer les commandes">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              role="tab"
              aria-selected={filter === f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full border px-3 py-1.5 text-xs transition ${
                filter === f.key
                  ? "border-amber-500 bg-amber-500/10 text-amber-400"
                  : "border-carbon-600 text-steel-300 hover:border-steel-400"
              }`}
            >
              {f.label}
              <span className="ml-1.5 text-steel-400">{counts[f.key]}</span>
            </button>
          ))}
        </div>

        <div className="relative sm:w-64">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-steel-400"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nom, téléphone, suivi…"
            aria-label="Rechercher une commande"
            className="w-full rounded-full border border-carbon-600 bg-carbon-900 py-2 pl-9 pr-3 text-sm outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Téléphone : une carte par commande (aucun défilement horizontal) */}
      <ul className="mt-4 space-y-3 md:hidden">
        {visible.map((o) => {
          const qty = o.items.reduce((n, i) => n + i.qty, 0);
          return (
            <li
              key={o.id}
              className={`rounded-xl border p-4 ${
                needsParcel(o) ? "border-red-500/40 bg-red-500/5" : "border-carbon-700 bg-carbon-900"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{o.full_name}</p>
                  <p className="text-xs text-steel-400">{formatPhone(o.phone)}</p>
                  <p className="text-xs text-steel-400/70">{formatDateTime(o.created_at)}</p>
                </div>
                <p className="shrink-0 font-display text-base text-amber-400">{formatDZD(o.total)}</p>
              </div>

              <p className="mt-3 text-sm">
                {wilayaNames[o.wilaya_id] ?? `Wilaya n°${o.wilaya_id}`}
                <span className="text-steel-400">
                  {" · "}
                  {communeNames[o.commune_id] ?? `Commune n°${o.commune_id}`}
                  {" · "}
                  {o.delivery_type === "stopdesk" ? "Point relais" : "Domicile"}
                </span>
              </p>
              <p className="mt-1 text-xs text-steel-400">
                {qty} article{qty > 1 ? "s" : ""} — {o.items.map((i) => i.name).join(", ")}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <OrderStatusSelect
                  orderId={o.id}
                  initialStatus={o.status}
                  onChanged={(status) => patchOrder(o.id, { status })}
                />
                {o.yalidine_tracking ? (
                  <span className="font-mono text-xs text-amber-400">{o.yalidine_tracking}</span>
                ) : needsParcel(o) ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-300">
                    <AlertTriangle size={11} />
                    Colis non créé
                  </span>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => setOpenId(o.id)}
                className="mt-3 w-full rounded-full border border-carbon-600 py-2 text-sm text-porcelain transition hover:border-amber-500 hover:text-amber-400"
              >
                Voir les détails
              </button>
            </li>
          );
        })}
        {visible.length === 0 && (
          <li className="rounded-xl border border-dashed border-carbon-600 px-4 py-10 text-center text-steel-400">
            {orders.length === 0
              ? "Aucune commande pour le moment."
              : "Aucune commande ne correspond à ce filtre."}
          </li>
        )}
      </ul>

      {/* Ordinateur / tablette : tableau */}
      <div className="mt-4 hidden overflow-x-auto rounded-xl border border-carbon-700 md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-carbon-700 bg-carbon-900 text-steel-400">
            <tr>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Destination</th>
              <th className="px-4 py-3">Articles</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Suivi Yalidine</th>
              <th className="px-4 py-3">
                <span className="sr-only">Détails</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-carbon-700">
            {visible.map((o) => {
              const qty = o.items.reduce((n, i) => n + i.qty, 0);
              return (
                <tr key={o.id} className={needsParcel(o) ? "bg-red-500/5" : ""}>
                  <td className="px-4 py-3">
                    <p>{o.full_name}</p>
                    <p className="text-xs text-steel-400">{formatPhone(o.phone)}</p>
                    <p className="text-xs text-steel-400/70">{formatDateTime(o.created_at)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p>{wilayaNames[o.wilaya_id] ?? `Wilaya n°${o.wilaya_id}`}</p>
                    <p className="text-xs text-steel-400">
                      {communeNames[o.commune_id] ?? `Commune n°${o.commune_id}`} ·{" "}
                      {o.delivery_type === "stopdesk" ? "Point relais" : "Domicile"}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p>
                      {qty} article{qty > 1 ? "s" : ""}
                    </p>
                    <p className="max-w-[180px] truncate text-xs text-steel-400">
                      {o.items.map((i) => i.name).join(", ")}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">{formatDZD(o.total)}</td>
                  <td className="px-4 py-3">
                    <OrderStatusSelect
                      orderId={o.id}
                      initialStatus={o.status}
                      onChanged={(status) => patchOrder(o.id, { status })}
                    />
                  </td>
                  <td className="px-4 py-3">
                    {o.yalidine_tracking ? (
                      <span className="font-mono text-xs text-amber-400">
                        {o.yalidine_tracking}
                      </span>
                    ) : needsParcel(o) ? (
                      <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-300">
                        <AlertTriangle size={11} />
                        Colis non créé
                      </span>
                    ) : (
                      <span className="text-xs text-steel-400/70">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setOpenId(o.id)}
                      className="rounded-full border border-carbon-600 px-3 py-1.5 text-xs text-porcelain transition hover:border-amber-500 hover:text-amber-400"
                    >
                      Détails
                    </button>
                  </td>
                </tr>
              );
            })}
            {visible.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-steel-400">
                  {orders.length === 0
                    ? "Aucune commande pour le moment."
                    : "Aucune commande ne correspond à ce filtre."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {opened && (
        <OrderDetailsModal
          order={opened}
          wilayaName={wilayaNames[opened.wilaya_id]}
          communeName={communeNames[opened.commune_id]}
          onClose={closeModal}
          onChange={(patch) => patchOrder(opened.id, patch)}
        />
      )}
    </>
  );
}