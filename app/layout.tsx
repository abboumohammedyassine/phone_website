import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/site";
import Toaster from "@/components/Toaster";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["500", "600", "700"],
});
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL), // remplace par ton vrai domaine
  title: {
    default: "Phone House Maghnia — Téléphones, PC & Accessoires en Algérie",
    template: "%s | Phone House Maghnia",
  },
  description:
    "Achetez vos téléphones, PC portables, audio et accessoires en Algérie. Paiement à la livraison (COD) partout dans les 58 wilayas via Yalidine.",
  keywords: [
    "téléphone Algérie", "smartphone Algeria", "iPhone Algérie", "Samsung Algérie",
    "PC portable Algérie", "livraison Algérie", "COD Algérie", "Phone House Maghnia",
  ],
  openGraph: {
    type: "website",
    locale: "fr_DZ",
    siteName: "Phone House Maghnia",
    title: "Phone House Maghnia — La tech livrée jusqu'à ta porte",
    description: "Téléphones, PC, audio et accessoires. Paiement à la livraison partout en Algérie.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "Phone House Maghnia" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Phone House Maghnia — La tech livrée jusqu'à ta porte",
    description: "Paiement à la livraison partout en Algérie.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrains.variable}`}>
      <body className="bg-carbon-950 text-porcelain font-body antialiased">
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
        
<WhatsAppButton />
        <Toaster />
      </body>
    </html>
  );
}