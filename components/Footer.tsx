import Link from "next/link";
import { Truck, ShieldCheck, Phone, Mail, Instagram, Facebook } from "lucide-react";

// Liens réseaux sociaux : à renseigner dans Vercel (NEXT_PUBLIC_INSTAGRAM_URL / NEXT_PUBLIC_FACEBOOK_URL).
// Tant qu'ils sont vides, les icônes ne s'affichent pas (plus de lien vers la page d'accueil d'Instagram).
const INSTAGRAM_URL = process.env.NEXT_PUBLIC_INSTAGRAM_URL?.trim();
const FACEBOOK_URL = process.env.NEXT_PUBLIC_FACEBOOK_URL?.trim();

const socialClass =
  "flex h-9 w-9 items-center justify-center rounded-full border border-carbon-600 text-steel-400 transition hover:border-amber-500 hover:text-amber-500";

export default function Footer() {
  return (
    <footer className="border-t border-carbon-700 bg-carbon-950 pt-16 pb-8">
      <div className="mx-auto max-w-7xl px-5">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="font-display text-xl font-700">
              Phone House <span className="text-amber-500">Maghnia</span>
            </Link>
            <p className="mt-3 text-sm text-steel-400 leading-relaxed">
              Votre destination tech en Algérie. Paiement à la livraison, partout dans les 58 wilayas.
            </p>
            {(INSTAGRAM_URL || FACEBOOK_URL) && (
              <div className="mt-4 flex gap-3">
                {INSTAGRAM_URL && (
                  <a
                    href={INSTAGRAM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className={socialClass}
                  >
                    <Instagram size={16} />
                  </a>
                )}
                {FACEBOOK_URL && (
                  <a
                    href={FACEBOOK_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    className={socialClass}
                  >
                    <Facebook size={16} />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Catalogue */}
          <div>
            <h3 className="mb-4 font-mono text-xs uppercase tracking-widest text-steel-400">
              Catalogue
            </h3>
            <ul className="space-y-2.5">
              {[
                { href: "/catalogue?cat=telephones", label: "Téléphones" },
                { href: "/catalogue?cat=pc", label: "PC & Portables" },
                { href: "/catalogue?cat=audio", label: "Audio" },
                { href: "/catalogue?cat=accessoires", label: "Accessoires" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-steel-400 transition hover:text-porcelain">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Infos */}
          <div>
            <h3 className="mb-4 font-mono text-xs uppercase tracking-widest text-steel-400">
              Informations
            </h3>
            <ul className="space-y-2.5">
              {[
                { href: "/livraison", label: "Livraison & délais" },
                { href: "/suivi", label: "Suivre ma commande" },
                { href: "/retours", label: "Politique de retour" },
                { href: "/garantie", label: "Garantie produits" },
                { href: "/cgv", label: "CGV" },
                { href: "/mentions-legales", label: "Mentions légales" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-steel-400 transition hover:text-porcelain">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 font-mono text-xs uppercase tracking-widest text-steel-400">
              Contact
            </h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-steel-400">
                <Phone size={14} className="shrink-0 text-amber-500" />
                <a href="tel:+213542900219" className="hover:text-porcelain transition">
                  0542 90 02 19
                </a>
              </li>
              <li className="flex items-center gap-2 text-sm text-steel-400">
                <Mail size={14} className="shrink-0 text-amber-500" />
                <a href="mailto:contact@phonehouse-maghnia.com" className="hover:text-porcelain transition">
                  contact@phonehouse-maghnia.com
                </a>
              </li>
            </ul>

            <div className="mt-6 rounded-xl border border-carbon-700 bg-carbon-900 p-4">
              <div className="flex items-center gap-2 text-sm">
                <Truck size={14} className="text-cyan-400" />
                <span className="text-steel-300">Livraison Yalidine COD</span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm">
                <ShieldCheck size={14} className="text-green-400" />
                <span className="text-steel-300">Produits garantis</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-carbon-800 pt-6 text-xs text-steel-500 sm:flex-row">
          <p>© {new Date().getFullYear()} Phone House Maghnia. Tous droits réservés.</p>
          <p>Paiement 100% à la livraison — Aucune carte requise</p>
        </div>
      </div>
    </footer>
  );
}