import PrivacyPreferences from '@/components/marketing/PrivacyPreferences';
import CatalogPosition from "@/components/catalog/CatalogPosition";
import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { CartProvider } from "@/components/cart/CartProvider";
import "./globals.css";
import "./comfort.css";
import "./black-friday.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.estorehouse.ro"),
  title: {
    default: "E-Store House — Arta de a te simți acasă",
    template: "%s | E-Store House",
  },
  description:
    "Descoperă lenjerii de pat, pilote și textile alese pentru casă. Texturi fine și nuanțe calde pentru un cămin elegant.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ro"
      className={`${inter.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org", "@type": "Organization", "@id": "https://www.estorehouse.ro/#organization",
          name: "E-Store House", url: "https://www.estorehouse.ro", logo: "https://www.estorehouse.ro/brand/estore-house-icon.png",
        }) }} />
        <CartProvider><CatalogPosition/>{children}<PrivacyPreferences/></CartProvider>
      </body>
    </html>
  );
}
