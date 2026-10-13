import { LegalPage, LegalSection } from "@/components/LegalPage";

export const metadata = {
  title: "Politique de retour — Phone House Maghnia",
};

export default function RetoursPage() {
  return (
    <LegalPage title="Politique de retour" updatedAt="11 août 2026">
      <LegalSection title="Délai de retour">
        <p>
          Vous disposez de <strong className="text-porcelain">7 jours</strong>{" "}
          à compter de la réception de votre colis pour signaler un problème et
          demander un retour ou un échange, à condition que le produit soit
          resté dans son état d&apos;origine.
        </p>
      </LegalSection>

      <LegalSection title="Conditions d'acceptation">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Le produit n&apos;a pas été utilisé, ni endommagé</li>
          <li>L&apos;emballage d&apos;origine et les accessoires sont complets</li>
          <li>Une preuve d&apos;achat (numéro de commande) est fournie</li>
        </ul>
      </LegalSection>

      <LegalSection title="Cas de retour accepté">
        <p>
          Produit reçu défectueux, endommagé pendant le transport, ou ne
          correspondant pas à la description / commande passée. Dans ces cas,
          l&apos;échange ou le remboursement se fait sans frais supplémentaires
          pour le client.
        </p>
      </LegalSection>

      <LegalSection title="Comment faire une demande de retour ?">
        <p>
          Contactez-nous à contact@phonehouse-maghnia.com ou par téléphone en précisant
          votre numéro de commande et le motif du retour. Nous vous
          indiquerons la marche à suivre (retour via Yalidine ou point de
          dépôt).
        </p>
      </LegalSection>

      <LegalSection title="Remboursement">
        <p>
          Le remboursement, lorsqu&apos;il est applicable, s&apos;effectue après
          réception et vérification du produit retourné, sous un délai de 7 à
          14 jours ouvrés, selon le mode convenu avec le client (versement
          Yalidine, virement ou avoir).
        </p>
      </LegalSection>
    </LegalPage>
  );
}