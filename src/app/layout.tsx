import type { Metadata, Viewport } from "next";
import { Cinzel, Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

/* Self-hosted, subset & preloaded by next/font — zero runtime font requests */
const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-display",
  display: "swap",
});
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif-alt",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "CELESTIA",
  description:
    "A living celestial instrument: real-time planetary tracking over a true bright-star firmament, moon phases, natal astrology, planetary hours, alchemical correspondences, transit horoscopes and NASA deep-space imagery — computed from arcsecond-grade ephemeris data.",
  keywords: [
    "astrology", "astronomy", "moon phase", "planetary hours", "alchemical correspondences",
    "natal chart", "ephemeris", "celestial", "zodiac", "retrograde", "sky map", "NASA",
  ],
  authors: [{ name: "Celestia Observatory" }],
  openGraph: {
    title: "CELESTIA — Live Celestial Observatory",
    description:
      "Live planetary tracking over a real star firmament, moon phases, natal astrology, the alchemical grimoire and the NASA cosmic archive.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${cinzel.variable} ${cormorant.variable} ${inter.variable}`}>
      <body className="antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
