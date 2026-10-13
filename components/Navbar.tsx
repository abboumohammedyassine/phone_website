"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Search, Heart, ShoppingBag, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/lib/cart-store";
import { useWishlistStore } from "@/lib/wishlist-store";

const NAV_LINKS = [
  { href: "/catalogue?cat=telephones", label: "Téléphones" },
  { href: "/catalogue?cat=pc", label: "PC & Portables" },
  { href: "/catalogue?cat=audio", label: "Audio" },
  { href: "/catalogue?cat=accessoires", label: "Accessoires" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const totalItems = useCartStore((s) => s.items.reduce((acc, i) => acc + i.qty, 0));
  const wishlistCount = useWishlistStore((s) => s.items.length);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "border-b border-carbon-700 bg-carbon-950/95 shadow-xl shadow-black/30 backdrop-blur-xl"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
          {/* Logo */}
          <Link
            href="/"
            className="font-display text-xl font-700 transition-opacity hover:opacity-80"
          >
            Phone House <span className="text-amber-500">Maghnia</span>
          </Link>

          {/* Nav desktop */}
          <nav className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="relative rounded-full px-4 py-1.5 text-sm text-steel-300 transition-colors hover:text-porcelain group"
              >
                {label}
                <span className="absolute inset-x-4 bottom-0 h-px scale-x-0 rounded-full bg-amber-500 transition-transform group-hover:scale-x-100" />
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Recherche */}
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Rechercher"
              className="flex h-9 w-9 items-center justify-center rounded-full text-steel-400 transition hover:bg-carbon-800 hover:text-porcelain"
            >
              <Search size={18} />
            </button>

            {/* Favoris */}
            <Link
              href="/wishlist"
              aria-label="Favoris"
              className="relative flex h-9 w-9 items-center justify-center rounded-full text-steel-400 transition hover:bg-carbon-800 hover:text-porcelain"
            >
              <Heart size={18} />
              <AnimatePresence>
                {wishlistCount > 0 && (
                  <motion.span
                    key="wishlist-badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-carbon-950"
                  >
                    {wishlistCount > 9 ? "9+" : wishlistCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>

            {/* Panier */}
            <Link
              href="/panier"
              aria-label="Panier"
              className="relative flex h-9 w-9 items-center justify-center rounded-full text-steel-400 transition hover:bg-carbon-800 hover:text-porcelain"
            >
              <ShoppingBag size={18} />
              <AnimatePresence>
                {totalItems > 0 && (
                  <motion.span
                    key="badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-carbon-950"
                  >
                    {totalItems > 9 ? "9+" : totalItems}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>

            {/* Mobile menu */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Menu"
              className="flex h-9 w-9 items-center justify-center rounded-full text-steel-400 transition hover:bg-carbon-800 md:hidden"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-carbon-700 bg-carbon-950 md:hidden"
            >
              <nav className="flex flex-col p-4 gap-1">
                {NAV_LINKS.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-xl px-4 py-3 text-sm text-steel-300 transition hover:bg-carbon-800 hover:text-porcelain"
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Overlay de recherche */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-start justify-center bg-carbon-950/90 backdrop-blur-xl pt-24 px-5"
            onClick={(e) => e.target === e.currentTarget && setSearchOpen(false)}
          >
            <motion.div
              initial={{ y: -20, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -20, opacity: 0, scale: 0.96 }}
              className="w-full max-w-xl"
            >
              <div className="relative">
                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-steel-400" />
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un produit..."
                  className="w-full rounded-2xl border border-carbon-600 bg-carbon-900 py-4 pl-12 pr-12 text-base outline-none focus:border-amber-500"
                />
                <button
                  onClick={() => setSearchOpen(false)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-steel-400 hover:text-porcelain"
                >
                  <X size={18} />
                </button>
              </div>
              {searchQuery && (
                <Link
                  href={`/catalogue?q=${encodeURIComponent(searchQuery)}`}
                  onClick={() => setSearchOpen(false)}
                  className="mt-3 block rounded-xl border border-carbon-700 bg-carbon-900 px-4 py-3 text-sm text-steel-300 hover:border-carbon-500"
                >
                  Chercher "{searchQuery}" dans le catalogue →
                </Link>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}