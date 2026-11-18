import type { Metadata, Viewport } from "next";
import { Inter, Archivo } from "next/font/google";
import "./globals.css";
import "./motion.css";
import "./scenes.css";
import "./chatbot.css";
import "./home.css";
import { getSettings } from "@/lib/content";
import { PRELOADER_SKIP } from "@/lib/motion-const";
import { SITE_URL, hexToRgbTriplet, lighten } from "@/lib/utils";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap", fallback: ["system-ui", "Arial", "sans-serif"] });
// Grotesque large et très grasse, dans l'esprit des capitales du logo (axe de largeur variable).
const serif = Archivo({ subsets: ["latin"], axes: ["wdth"], weight: "variable", variable: "--font-serif", display: "swap", fallback: ["system-ui", "Arial", "sans-serif"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "QS2H — Création de sites web pour entreprises à Bordeaux", template: "%s | QS2H" },
  description: "QS2H conçoit des sites vitrines, sur mesure et e-commerce pour TPE, PME et indépendants : design soigné, chargement rapide, référencement Google.",
  applicationName: "QS2H",
  icons: { icon: "/icon-512.png", apple: "/apple-touch-icon.png" },
  manifest: "/manifest.webmanifest",
  formatDetection: { telephone: false },
};
export const viewport: Viewport = { themeColor: "#1C1C1C", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings();
  const css = `:root{--accent:${hexToRgbTriplet(s.theme.accent)};--accent-hi:${lighten(s.theme.accent)};--accent-hover:${lighten(s.theme.accent, -0.25)}}`;
  return (
    <html lang="fr" className={`${sans.variable} ${serif.variable}`} suppressHydrationWarning>
      <head>
        <meta name="darkreader-lock" />
        <style dangerouslySetInnerHTML={{ __html: css }} />
        <script dangerouslySetInnerHTML={{ __html: PRELOADER_SKIP }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
