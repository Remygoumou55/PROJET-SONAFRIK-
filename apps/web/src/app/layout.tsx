import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { connection } from "next/server";
import { Montserrat } from "next/font/google";
import { SONAFRIK_BRAND } from "@sonafrik/types";
import "./globals.css";

/** Variable font — un seul fichier réseau au lieu de 4 poids statiques (LCP texte). */
const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://sonafrik.vercel.app";
const SUPABASE_HOST = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://cxjpburiiazzvlczzupy.supabase.co";

export const viewport: Viewport = {
  themeColor: "var(--color-noir-profond)",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: `${SONAFRIK_BRAND.name} — ${SONAFRIK_BRAND.slogan}`,
    template: `%s — ${SONAFRIK_BRAND.name}`,
  },
  description: "Music Operating System Africain — Écouter, publier et monétiser la musique africaine.",
  applicationName: "SONAFRIK",
  keywords: ["musique africaine", "streaming", "artistes", "Guinée", "Africa", "SONAFRIK"],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: APP_URL,
    siteName: "SONAFRIK",
    title: `${SONAFRIK_BRAND.name} — ${SONAFRIK_BRAND.slogan}`,
    description: "Music Operating System Africain — Écouter, publier et monétiser la musique africaine.",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SONAFRIK_BRAND.name} — ${SONAFRIK_BRAND.slogan}`,
    description: "Music Operating System Africain — Écouter, publier et monétiser la musique africaine.",
  },
  robots: { index: true, follow: true },
  manifest: "/manifest.webmanifest",
  icons: [
    { rel: "icon", type: "image/png", url: "/favicon.png" },
    { rel: "apple-touch-icon", url: "/apple-icon.png" },
    { rel: "shortcut icon", url: "/favicon.png" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Requis pour CSP nonce en prod — sans cela les scripts Next.js sont bloqués (écran noir).
  await connection();
  void (await headers()).get("x-nonce");

  return (
    <html lang="fr" className="dark">
      <head>
        <link rel="preconnect" href={SUPABASE_HOST} crossOrigin="anonymous" />
        <link rel="dns-prefetch" href={SUPABASE_HOST} />
        <link rel="dns-prefetch" href="https://vitals.vercel-insights.com" />
        <link rel="preconnect" href="https://accounts.google.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://accounts.google.com" />
      </head>
      <body className={`${montserrat.variable} min-h-dvh font-sans antialiased bg-noir-profond text-texte-principal`}>
        {children}
      </body>
    </html>
  );
}
