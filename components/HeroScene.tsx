"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

// three.js pèse ~220 Ko : on ne le télécharge que si l'appareil peut l'afficher confortablement.
// ssr:false + import dynamique = le code 3D n'est PAS dans le premier chargement de la page.
const Hero3D = dynamic(() => import("@/components/Hero3D"), { ssr: false });

type NavigatorHints = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean; effectiveType?: string };
};

/** Faux sur téléphone, écran étroit, mouvement réduit, économiseur de données, appareil modeste. */
function canRender3D(): boolean {
  const wide = window.matchMedia("(min-width: 768px)").matches;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const nav = navigator as NavigatorHints;
  const lowCpu = (nav.hardwareConcurrency ?? 8) < 4;
  const lowMemory = (nav.deviceMemory ?? 8) < 4;
  const saveData = !!nav.connection?.saveData;
  const slowNetwork = /(^|-)2g$/.test(nav.connection?.effectiveType ?? "");
  return wide && !reduceMotion && !lowCpu && !lowMemory && !saveData && !slowNetwork;
}

export default function HeroScene() {
  const holderRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(true);

  // 1) Décide si la scène 3D est affichée, APRÈS le premier rendu (le titre apparaît d'abord).
  useEffect(() => {
    let cancelled = false;
    const decide = () => {
      if (!cancelled) setEnabled(canRender3D());
    };
    const idle = (window as any).requestIdleCallback as ((cb: () => void) => number) | undefined;
    const handle = idle ? idle(decide) : window.setTimeout(decide, 300);

    const mq = window.matchMedia("(min-width: 768px)");
    mq.addEventListener("change", decide);
    return () => {
      cancelled = true;
      mq.removeEventListener("change", decide);
      if (idle) (window as any).cancelIdleCallback?.(handle);
      else window.clearTimeout(handle);
    };
  }, []);

  // 2) Met le rendu en pause quand le héros n'est plus à l'écran (batterie, fluidité du défilement).
  useEffect(() => {
    const el = holderRef.current;
    if (!el || !enabled) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      threshold: 0,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [enabled]);

  return (
    <div ref={holderRef} className="absolute inset-0" aria-hidden="true">
      {enabled && <Hero3D active={visible} />}
    </div>
  );
}
