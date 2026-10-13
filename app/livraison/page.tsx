import { LegalPage, LegalSection } from "@/components/LegalPage";

export const metadata = {
  title: "Livraison & délais — Phone House Maghnia",
};

export default function LivraisonPage() {
  return (
    <LegalPage title="Livraison & délais" updatedAt="11 août 2026">
      <LegalSection title="Zone de livraison">
        <p>
          Phone House Maghnia livre sur l&apos;ensemble des 58 wilayas d&apos;Algérie via
          Yalidine Express, en points de retrait (stopdesk) ou à domicile selon
          la disponibilité dans votre commune.
        </p>
      </LegalSection>

      <LegalSection title="Délais indicatifs">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Alger et grandes wilayas : 24 à 48h ouvrées</li>
          <li>Reste du territoire : 2 à 5 jours ouvrés</li>
          <li>Zones sud / éloignées : jusqu&apos;à 7 jours ouvrés</li>
        </ul>
        <p className="mt-2 text-xs text-steel-500">
          Ces délais sont donnés à titre indicatif par le transporteur Yalidine
          et peuvent varier selon les conditions de circulation ou d&apos;accès
          à la commune.
        </p>
      </LegalSection>

      <LegalSection title="Frais de livraison">
        <p>
          Les frais de livraison sont calculés automatiquement selon votre
          wilaya et affichés avant la validation finale de la commande, au
          niveau du checkout.
        </p>
      </LegalSection>

      <LegalSection title="Suivi de commande">
        <p>
          Dès la prise en charge du colis par Yalidine, un numéro de suivi vous
          est communiqué sur la page de confirmation de commande. Vous pouvez
          suivre l&apos;état de votre colis directement depuis l&apos;application
          ou le site Yalidine avec ce numéro.
        </p>
      </LegalSection>

      <LegalSection title="En cas d'absence">
        <p>
          Le livreur tentera de vous joindre au numéro fourni lors de la
          commande. En cas d&apos;échec de livraison, le colis peut être
          redéposé en point stopdesk ou renvoyé selon la procédure Yalidine
          standard.
        </p>
      </LegalSection>
    </LegalPage>
  );
}