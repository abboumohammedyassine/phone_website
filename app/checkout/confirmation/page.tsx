 import Link from "next/link";
import { CheckCircle2, Truck, Clock } from "lucide-react";

export default function ConfirmationPage({
  searchParams,
}: {
  searchParams: { tracking?: string; pending?: string };
}) {
  const hasTracking = !!searchParams.tracking;

  return (
    <div className="mx-auto max-w-lg px-5 py-24 text-center">
      <CheckCircle2 className="mx-auto text-amber-500" size={48} />
      <h1 className="mt-4 font-display text-2xl font-600">Commande reçue</h1>

      {hasTracking ? (
        <>
          <p className="mt-2 text-steel-400">
            Ton colis est en préparation. Tu paieras en espèces à la réception.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-carbon-600 px-4 py-2 text-sm">
            <Truck size={15} className="text-cyan-400" />
            Suivi Yalidine :{" "}
            <span className="font-mono text-amber-400">{searchParams.tracking}</span>
          </div>
        </>
      ) : (
        <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-left text-sm text-porcelain">
          <div className="flex items-start gap-2">
            <Clock size={16} className="mt-0.5 shrink-0 text-amber-400" />
            <p>
              Ta commande est bien enregistrée, mais l&apos;expédition n&apos;a
              pas encore été programmée automatiquement. Notre équipe va
              confirmer ta livraison manuellement sous peu — tu seras
              contacté(e) au numéro fourni. Aucun paiement n&apos;est requis
              tant que le colis n&apos;a pas été livré.
            </p>
          </div>
        </div>
      )}

      <div className="mt-8">
        <Link
          href="/catalogue"
          className="rounded-full bg-amber-500 px-6 py-3 text-sm font-medium text-carbon-950"
        >
          Continuer mes achats
        </Link>
      </div>
    </div>
  );
}
