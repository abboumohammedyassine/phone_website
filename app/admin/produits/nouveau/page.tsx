import ProduitForm from "../ProduitForm";
import { getExistingBrands } from "@/lib/brands-server";

export const dynamic = "force-dynamic";

export default async function NouveauProduitPage() {
  const existingBrands = await getExistingBrands();
  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="mb-6 font-display text-2xl font-600">Ajouter un produit</h1>
      <ProduitForm existingBrands={existingBrands} />
    </div>
  );
}
