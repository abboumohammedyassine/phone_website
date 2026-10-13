import { LegalPage, LegalSection } from "@/components/LegalPage";

export const metadata = {
  title: "Mentions légales — Phone House Maghnia",
};

export default function MentionsLegalesPage() {
  return (
    <LegalPage title="Mentions légales" updatedAt="11 août 2026">
      <LegalSection title="Éditeur du site">
        <p>
          Le site Phone House Maghnia (phonehouse-maghnia.com) est édité par{" "}
          <strong className="text-porcelain">Phone House Maghnia</strong>,
          {" "}
          <span className="text-porcelain">auto-entrepreneur</span>,
          dont le siège est situé à{" "}
          <span className="text-porcelain">Cité Cadi, Maghnia, wilaya de Tlemcen</span>,
          Algérie.
        </p>
        <p>
          Numéro de téléphone : <span className="text-porcelain">05 42 90 02 19</span>
          <br />
          Email de contact : contact@phonehouse-maghnia.com
        </p>
      </LegalSection>

      <LegalSection title="Directeur de la publication">
        <p>
          <span className="text-porcelain">Abbou Yahia</span>, en qualité de
          gérant / propriétaire du site.
        </p>
      </LegalSection>

      <LegalSection title="Hébergement">
        <p>
          Le site est hébergé par Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA
          91789, États-Unis. La base de données et les fichiers sont hébergés par
          Supabase Inc.
        </p>
      </LegalSection>

      <LegalSection title="Propriété intellectuelle">
        <p>
          L&apos;ensemble des contenus présents sur ce site (textes, images,
          logos, structure, code) est la propriété de Phone House Maghnia ou de ses
          fournisseurs, sauf mention contraire. Toute reproduction, totale ou
          partielle, sans autorisation préalable est interdite.
        </p>
      </LegalSection>

      <LegalSection title="Données personnelles">
        <p>
          Les informations collectées lors d&apos;une commande (nom, téléphone,
          adresse) sont utilisées uniquement pour le traitement et la livraison
          de la commande via Yalidine. Elles ne sont ni vendues ni transmises à
          des tiers en dehors du prestataire de livraison. Conformément à la loi
          n° 18-07 relative à la protection des personnes physiques dans le
          traitement des données à caractère personnel, vous pouvez demander
          l&apos;accès, la rectification ou la suppression de vos données en
          nous contactant à contact@phonehouse-maghnia.com.
        </p>
      </LegalSection>

      <LegalSection title="Cookies">
        <p>
          Le site utilise des cookies techniques nécessaires au fonctionnement
          du panier et de la session. Aucun cookie publicitaire tiers n&apos;est
          utilisé à ce jour.
        </p>
      </LegalSection>
    </LegalPage>
  );
}