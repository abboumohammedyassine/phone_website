import { LegalPage, LegalSection } from "@/components/LegalPage";

export const metadata = {
  title: "Garantie produits — Phone House Maghnia",
};

export default function GarantiePage() {
  return (
    <LegalPage title="Garantie produits" updatedAt="11 août 2026">
      <LegalSection title="Garantie légale">
        <p>
          Tous les produits vendus sur Phone House Maghnia bénéficient de la garantie
          légale de conformité, couvrant les défauts existants au moment de la
          livraison et non causés par une mauvaise utilisation.
        </p>
      </LegalSection>

      <LegalSection title="Durée">
        <p>
          Sauf indication contraire sur la fiche produit, la garantie
          commerciale est de{" "}
          <strong className="text-porcelain">[à préciser — ex. 6 ou 12 mois]</strong>{" "}
          à compter de la date de livraison, selon la catégorie de produit
          (téléphones, PC, audio, accessoires).
        </p>
      </LegalSection>

      <LegalSection title="Ce qui est couvert">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Panne matérielle non liée à un choc ou une mauvaise manipulation</li>
          <li>Défaut de fabrication</li>
          <li>Non-conformité avec la description du produit</li>
        </ul>
      </LegalSection>

      <LegalSection title="Ce qui n'est pas couvert">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Casse, chute, contact avec l&apos;eau</li>
          <li>Usure normale (batterie, écran rayé)</li>
          <li>Intervention ou réparation par un tiers non agréé</li>
        </ul>
      </LegalSection>

      <LegalSection title="Faire jouer la garantie">
        <p>
          Contactez-nous à contact@phonehouse-maghnia.com avec votre numéro de commande et
          une description du problème. Selon le cas, le produit sera réparé,
          échangé, ou remboursé.
        </p>
      </LegalSection>
    </LegalPage>
  );
}