import Link from "next/link";
import Hero3D from "@/components/Hero3D";
import ProductGrid from "@/components/ProductGrid";
import ScrollReveal from "@/components/ScrollReveal";
import MarqueeBar from "@/components/MarqueeBar";
import {
  ArrowRight, Truck, ShieldCheck, RotateCcw,
  Headphones, Smartphone, Laptop, Mic2, Package,
  Star, Users, MapPin,
} from "lucide-react";
import { getFeaturedProducts } from "@/lib/products";

export default async function HomePage() {
  const products = await getFeaturedProducts();

  return (
    <>
      {/* ── HERO ───────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-circuit-fade">
        <Hero3D />
        <div className="relative mx-auto flex min-h-[90vh] max-w-7xl flex-col justify-center px-5">
          <ScrollReveal delay={0}>
            <span className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-carbon-600 bg-carbon-900/60 px-3 py-1 text-xs text-steel-300 backdrop-blur">
              <Truck size={13} className="text-cyan-400" />
              Livré par Yalidine · Paiement à la livraison · 58 wilayas
            </span>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <h1 className="max-w-xl font-display text-5xl font-600 leading-[1.05] md:text-7xl">
              La tech, livrée
              <br />
              <span className="text-gradient-amber">jusqu'à ta porte.</span>
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <p className="mt-6 max-w-md text-steel-300">
              Téléphones, PC, audio et accessoires — commandés en ligne,
              payés en cash à la réception, partout en Algérie.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.3}>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                href="/catalogue"
                className="group inline-flex items-center gap-2 rounded-full bg-amber-500 px-6 py-3 text-sm font-medium text-carbon-950 transition hover:bg-amber-400 hover:shadow-lg hover:shadow-amber-500/30"
              >
                Voir le catalogue
                <ArrowRight size={16} className="transition group-hover:translate-x-1" />
              </Link>
              <Link
                href="/catalogue?cat=telephones"
                className="inline-flex items-center rounded-full border border-carbon-600 px-6 py-3 text-sm text-porcelain transition hover:border-steel-400 hover:bg-carbon-800"
              >
                Derniers téléphones
              </Link>
            </div>
          </ScrollReveal>

          {/* Stats */}
          <ScrollReveal delay={0.4}>
            <div className="mt-16 flex flex-wrap gap-8">
              {[
                { icon: Users, value: "2 000+", label: "Clients satisfaits" },
                { icon: MapPin, value: "58", label: "Wilayas livrées" },
                { icon: Star, value: "4.9/5", label: "Note moyenne" },
              ].map(({ icon: Icon, value, label }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-carbon-800 border border-carbon-600">
                    <Icon size={16} className="text-amber-500" />
                  </div>
                  <div>
                    <div className="font-display text-lg font-600">{value}</div>
                    <div className="text-xs text-steel-400">{label}</div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── MARQUEE (défilement infini de marques) ──────────────────────── */}
      <MarqueeBar />

      {/* ── PRODUITS VEDETTES ───────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-5 py-24">
        <ScrollReveal>
          <div className="mb-12 flex items-end justify-between">
            <div>
              <p className="mb-1 font-mono text-xs uppercase tracking-widest text-cyan-400">
                Sélection
              </p>
              <h2 className="font-display text-3xl font-600">Les plus commandés</h2>
            </div>
            <Link href="/catalogue" className="text-sm text-steel-300 hover:text-porcelain transition">
              Tout voir →
            </Link>
          </div>
        </ScrollReveal>
        <ProductGrid products={products} />
      </section>

      {/* ── CATEGORIES GRID 3D ──────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-5 py-10">
        <ScrollReveal>
          <h2 className="mb-8 font-display text-2xl font-600">Parcourir par catégorie</h2>
        </ScrollReveal>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: "Téléphones", cat: "telephones", Icon: Smartphone, color: "from-blue-900/50 to-carbon-900", accent: "#60A5FA" },
            { label: "PC & Portables", cat: "pc", Icon: Laptop, color: "from-purple-900/50 to-carbon-900", accent: "#A78BFA" },
            { label: "Audio", cat: "audio", Icon: Headphones, color: "from-green-900/50 to-carbon-900", accent: "#34D399" },
            { label: "Accessoires", cat: "accessoires", Icon: Package, color: "from-amber-900/50 to-carbon-900", accent: "#F2A63A" },
          ].map(({ label, cat, Icon, color, accent }, i) => (
            <ScrollReveal key={cat} delay={i * 0.08}>
              <Link
                href={`/catalogue?cat=${cat}`}
                className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-carbon-700 bg-gradient-to-b ${color} p-6 transition-all duration-300 hover:-translate-y-1 hover:border-carbon-500 hover:shadow-2xl`}
                style={{ ["--accent" as string]: accent }}
              >
                <div
                  className="mb-8 flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `${accent}20`, border: `1px solid ${accent}40` }}
                >
                  <Icon size={22} style={{ color: accent }} />
                </div>
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-steel-500">
                    Catégorie
                  </span>
                  <h3 className="mt-1 font-display text-lg transition-colors group-hover:text-amber-500">
                    {label}
                  </h3>
                </div>
                <ArrowRight
                  size={16}
                  className="absolute right-4 top-4 text-steel-600 transition-all duration-300 group-hover:right-3 group-hover:text-amber-500"
                />
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ── TRUST BADGES ────────────────────────────────────────────────── */}
      <section className="border-y border-carbon-700 bg-carbon-900/80 py-12">
        <div className="mx-auto max-w-7xl px-5">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              {
                icon: Truck,
                title: "Livraison rapide",
                desc: "24–72h dans les 58 wilayas via Yalidine Express",
                color: "text-cyan-400",
              },
              {
                icon: ShieldCheck,
                title: "Produits garantis",
                desc: "Tous nos articles sont vérifiés avant expédition",
                color: "text-green-400",
              },
              {
                icon: RotateCcw,
                title: "Retour facile",
                desc: "7 jours pour changer d'avis si le produit est intact",
                color: "text-amber-400",
              },
            ].map(({ icon: Icon, title, desc, color }, i) => (
              <ScrollReveal key={title} delay={i * 0.1}>
                <div className="flex items-start gap-4 rounded-2xl border border-carbon-700 bg-carbon-900 p-5 transition hover:border-carbon-500">
                  <div className={`mt-0.5 shrink-0 ${color}`}>
                    <Icon size={22} />
                  </div>
                  <div>
                    <h3 className="font-medium">{title}</h3>
                    <p className="mt-1 text-sm text-steel-400">{desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ───────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-5 py-24 text-center">
        <ScrollReveal>
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-cyan-400">
            Prêt ?
          </p>
          <h2 className="font-display text-4xl font-600 md:text-5xl">
            Explore tout le catalogue
          </h2>
          <p className="mx-auto mt-4 max-w-md text-steel-400">
            Des centaines de produits tech disponibles, livrés partout en Algérie.
            Paiement 100% à la livraison — aucun risque.
          </p>
          <Link
            href="/catalogue"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-amber-500 px-8 py-4 font-medium text-carbon-950 transition hover:bg-amber-400 hover:shadow-xl hover:shadow-amber-500/30"
          >
            Voir tous les produits <ArrowRight size={18} />
          </Link>
        </ScrollReveal>
      </section>
    </>
  );
}
