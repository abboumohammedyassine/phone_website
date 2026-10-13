"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { Product } from "@/lib/types";
import { formatDZD } from "@/lib/utils";
import { useRef } from "react";
import { useWishlistStore } from "@/lib/wishlist-store";

// Variantes pour le scroll reveal — utilisées par ProductGrid
export const cardVariants = {
  hidden: { opacity: 0, y: 48, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 260, damping: 28 },
  },
};

export default function ProductCard({ product }: { product: Product }) {
  const discount =
    product.compare_at_price && product.compare_at_price > product.price
      ? Math.round(100 - (product.price / product.compare_at_price) * 100)
      : null;

  const isWishlisted = useWishlistStore((s) => s.has(product.id));
  const toggleWishlist = useWishlistStore((s) => s.toggle);

  function handleWishlistClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.images?.[0] ?? "",
      price: product.price,
    });
  }

  // ── Tilt 3D au mouvement de souris ──────────────────────────────────────
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), {
    stiffness: 200, damping: 20,
  });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), {
    stiffness: 200, damping: 20,
  });
  const glareX = useTransform(x, [-0.5, 0.5], ["120%", "-20%"]);
  const glareY = useTransform(y, [-0.5, 0.5], ["120%", "-20%"]);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      variants={cardVariants}
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d", perspective: 800 }}
      className="group relative overflow-hidden rounded-2xl border border-carbon-700 bg-carbon-900 cursor-pointer"
    >
      {/* Reflet dynamique (glare) */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.07) 0%, transparent 60%)`,
        }}
      />

      {/* Favoris */}
      <button
        onClick={handleWishlistClick}
        aria-label={isWishlisted ? "Retirer des favoris" : "Ajouter aux favoris"}
        aria-pressed={isWishlisted}
        className={`absolute right-3 top-3 z-20 rounded-full bg-carbon-950/70 p-2 backdrop-blur transition hover:scale-110 ${
          isWishlisted ? "text-amber-500" : "text-steel-300 hover:text-amber-500"
        }`}
      >
        <Heart size={15} className={isWishlisted ? "fill-amber-500" : ""} />
      </button>

      {/* Badge promo */}
      {discount && (
        <span className="absolute left-3 top-3 z-20 rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-medium text-carbon-950 shadow-lg shadow-amber-500/30">
          -{discount}%
        </span>
      )}

      <Link href={`/produit/${product.slug}`}>
        {/* Image */}
        <div className="relative aspect-square bg-gradient-to-b from-carbon-800 to-carbon-900 overflow-hidden">
          {product.images?.[0] && (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-contain p-6 transition-all duration-500 group-hover:scale-110 group-hover:drop-shadow-[0_20px_40px_rgba(242,166,58,0.25)]"
              sizes="(max-width:768px) 50vw, 25vw"
            />
          )}
          {/* Overlay bouton rapide */}
          <div className="absolute inset-x-0 bottom-0 translate-y-full transition-transform duration-300 group-hover:translate-y-0 p-3">
            <div className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-2 text-xs font-medium text-carbon-950">
              <ShoppingCart size={14} />
              Commander
            </div>
          </div>
        </div>

        {/* Infos */}
        <div className="p-4">
          <p className="font-mono text-[11px] uppercase tracking-wide text-steel-400">
            {product.brand}
          </p>
          <h3 className="mt-1 line-clamp-1 text-sm font-medium leading-snug">
            {product.name}
          </h3>

          {/* Rating si disponible */}
          {product.rating && (
            <div className="mt-1.5 flex items-center gap-1">
              <Star size={11} className="fill-amber-500 text-amber-500" />
              <span className="text-[11px] text-steel-400">
                {product.rating} ({product.reviews_count ?? 0})
              </span>
            </div>
          )}

          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-base font-600 text-porcelain">
              {formatDZD(product.price)}
            </span>
            {product.compare_at_price && (
              <span className="text-xs text-steel-400 line-through">
                {formatDZD(product.compare_at_price)}
              </span>
            )}
          </div>

          {/* Stock */}
          {product.stock === 0 && (
            <span className="mt-1.5 block text-[11px] text-red-400">Rupture de stock</span>
          )}
          {product.stock > 0 && product.stock <= 3 && (
            <span className="mt-1.5 block text-[11px] text-amber-400">
              Plus que {product.stock} en stock !
            </span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
