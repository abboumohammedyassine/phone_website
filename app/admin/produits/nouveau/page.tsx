import ProduitForm from "../ProduitForm";

export default function NouveauProduitPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="mb-6 font-display text-2xl font-600">Ajouter un produit</h1>
      <ProduitForm />
    </div>
  );
}
