import { LegalPage, LegalSection } from "@/components/LegalPage";

export const metadata = {
  title: "Conditions Générales de Vente — Phone House Maghnia",
};

export default function CgvPage() {
  return (
    <LegalPage title="Conditions Générales de Vente" updatedAt="11 août 2026">
      <p>
        Les présentes Conditions Générales de Vente (CGV) régissent toute
        commande passée sur le site Phone House Maghnia. En validant une commande, le
        client déclare les avoir lues et acceptées sans réserve.
      </p>

      <LegalSection title="1. Produits et prix">
        <p>
          Les prix affichés sont en dinars algériens (DZD), toutes taxes
          comprises. Phone House Maghnia se réserve le droit de modifier ses prix à tout
          moment, sans effet sur les commandes déjà confirmées. Les visuels
          produits sont fournis à titre illustratif.
        </p>
      </LegalSection>

      <LegalSection title="2. Commande">
        <p>
          Une commande est validée dès que le client renseigne ses informations
          de livraison (nom, téléphone, wilaya, commune, adresse) et confirme
          le récapitulatif au niveau du checkout. Aucune carte bancaire n&apos;est
          requise : le paiement s&apos;effectue en espèces à la livraison
          (COD).
        </p>
      </LegalSection>

      <LegalSection title="3. Livraison">
        <p>
          La livraison est assurée par Yalidine Express sur l&apos;ensemble des
          58 wilayas. Les délais indicatifs sont détaillés sur la page{" "}
          <span className="text-amber-400">Livraison &amp; délais</span>. Un
          numéro de suivi est communiqué au client dès la prise en charge du
          colis.
        </p>
      </LegalSection>

      <LegalSection title="4. Paiement">
        <p>
          Le règlement s&apos;effectue exclusivement en espèces au moment de la
          réception du colis, directement auprès du livreur Yalidine. Le
          client s&apos;engage à être joignable au numéro fourni lors de la
          commande.
        </p>
      </LegalSection>

      <LegalSection title="5. Droit de rétractation et retours">
        <p>
          Les conditions de retour et d&apos;échange sont détaillées sur la
          page <span className="text-amber-400">Politique de retour</span>.
        </p>
      </LegalSection>

      <LegalSection title="6. Garantie">
        <p>
          Les produits vendus bénéficient de la garantie légale de conformité
          et, le cas échéant, d&apos;une garantie commerciale dont les
          modalités sont précisées sur la page{" "}
          <span className="text-amber-400">Garantie produits</span>.
        </p>
      </LegalSection>

      <LegalSection title="7. Responsabilité">
        <p>
          Phone House Maghnia ne saurait être tenu responsable des retards de livraison
          imputables au transporteur, ni d&apos;une inexactitude dans les
          coordonnées fournies par le client.
        </p>
      </LegalSection>

      <LegalSection title="8. Litiges">
        <p>
          Pour toute réclamation, le client peut nous contacter à
          contact@phonehouse-maghnia.com. À défaut d&apos;accord amiable, tout litige
          relève des juridictions algériennes compétentes.
        </p>
      </LegalSection>
    </LegalPage>
  );
}