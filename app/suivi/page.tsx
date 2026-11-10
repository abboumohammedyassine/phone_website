import type { Metadata } from "next";
import TrackingForm from "@/components/TrackingForm";

export const metadata: Metadata = {
  title: "Suivre ma commande",
  description: "Suis l'avancement de ta commande avec ton numéro de téléphone et ton numéro de commande.",
  robots: { index: false, follow: true }, // page utilitaire : inutile dans Google
};

export default function SuiviPage() {
  return (
    <div className="mx-auto max-w-lg px-5 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-cyan-400">Commande</p>
      <h1 className="mt-1 font-display text-3xl font-600">Suivre ma commande</h1>
      <p className="mb-8 mt-2 text-sm text-steel-400">
        Renseigne le téléphone utilisé pour la commande et son numéro pour voir où elle en est.
      </p>
      <TrackingForm />
    </div>
  );
}
