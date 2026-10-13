"use client";

import { motion } from "framer-motion";

const BRANDS = [
  "Apple", "Samsung", "Xiaomi", "ASUS", "Anker", "Sony",
  "JBL", "Huawei", "OnePlus", "Realme", "Oppo", "Lenovo",
];

export default function MarqueeBar() {
  return (
    <div className="border-y border-carbon-700 bg-carbon-950 py-4 overflow-hidden">
      <div className="flex">
        {/* On duplique pour un scroll infini fluide */}
        {[0, 1].map((i) => (
          <motion.div
            key={i}
            className="flex shrink-0 items-center gap-12 px-6"
            animate={{ x: "-100%" }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
              delay: i === 1 ? 0 : 0,
            }}
            style={{ x: i === 1 ? "0%" : "0%" }}
          >
            {BRANDS.map((brand) => (
              <span
                key={brand}
                className="font-mono text-xs uppercase tracking-widest text-steel-600 hover:text-steel-400 transition-colors whitespace-nowrap"
              >
                {brand}
              </span>
            ))}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
