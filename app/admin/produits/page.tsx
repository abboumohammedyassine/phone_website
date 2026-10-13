import Link from "next/link";
import Image from "next/image";
import { Plus, Pencil, Star } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase";
import type { Product } from "@/lib/types";
import DeleteProductButton from "./DeleteProductButton";

export const dynamic = "force-dynamic";

async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabaseAdmin()
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return [];
  return data as Product[];
}

export default async function AdminProduitsPage() {
  const products = await getProducts();

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-600">Produits</h1>
          <p className="text-sm text-steel-400">{products.length} produit(s)</p>
        </div>
        <Link
          href="/admin/produits/nouveau"
          className="flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-medium text-carbon-950 transition hover:bg-amber-400"
        >
          <Plus size={16} /> Ajouter un produit
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-carbon-700">
        <table className="w-full text-left text-sm">
          <thead className="bg-carbon-900 text-xs uppercase tracking-wide text-steel-400">
            <tr>
              <th className="px-4 py-3">Produit</th>
              <th className="px-4 py-3">Catégorie</th>
              <th className="px-4 py-3">Prix</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-carbon-800">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-carbon-900/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-carbon-800">
                      {p.images?.[0] && (
                        <Image
                          src={p.images[0]}
                          alt={p.name}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 font-medium">
                        {p.name}
                        {p.is_featured && (
                          <Star size={13} className="fill-amber-500 text-amber-500" />
                        )}
                      </div>
                      <div className="text-xs text-steel-500">{p.brand}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 capitalize text-steel-300">{p.category}</td>
                <td className="px-4 py-3">
                  <div>{p.price.toLocaleString("fr-FR")} DA</div>
                  {p.compare_at_price && (
                    <div className="text-xs text-steel-500 line-through">
                      {p.compare_at_price.toLocaleString("fr-FR")} DA
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  {p.stock > 0 ? (
                    <span className="text-steel-300">{p.stock}</span>
                  ) : (
                    <span className="rounded-full bg-red-950 px-2 py-0.5 text-xs text-red-400">
                      Rupture
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-3">
                    <Link
                      href={`/admin/produits/${p.id}`}
                      className="text-steel-400 hover:text-amber-500"
                      aria-label={`Modifier ${p.name}`}
                    >
                      <Pencil size={16} />
                    </Link>
                    <DeleteProductButton id={p.id} name={p.name} />
                  </div>
                </td>
              </tr>
            ))}

            {products.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-steel-500">
                  Aucun produit pour le moment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
