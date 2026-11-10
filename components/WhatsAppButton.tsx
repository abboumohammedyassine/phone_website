"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";

const NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

export default function WhatsAppButton() {
  const pathname = usePathname();
  const [href, setHref] = useState("");

  // Le message contient le lien de la page : sur une fiche produit,
  // vous savez tout de suite de quel produit parle le client.
  useEffect(() => {
    if (!NUMBER) return;
    const msg = `Bonjour, je suis intéressé par : ${window.location.href}`;
    setHref(`https://wa.me/${NUMBER}?text=${encodeURIComponent(msg)}`);
  }, [pathname]);

  if (!NUMBER || !href) return null;
  if (pathname.startsWith("/admin") || pathname.startsWith("/checkout")) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Discuter sur WhatsApp"
      className="fixed bottom-24 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-110 md:bottom-6 md:right-6"
    >
      <MessageCircle size={22} />
    </a>
  );
}