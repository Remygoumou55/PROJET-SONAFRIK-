import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import { SONAFRIK_BRAND } from "@sonafrik/types";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-montserrat",
  display: "swap",
  preload: true,
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://sonafrik.vercel.app";
const SUPABASE_HOST = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://cxjpburiiazzvlczzupy.supabase.co";

export const viewport: Viewport = {
  themeColor: "var(--color-noir-profond)",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <head>
        <link rel="preconnect" href={SUPABASE_HOST} crossOrigin="anonymous" />
        <link rel="dns-prefetch" href={SUPABASE_HOST} />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://vitals.vercel-insights.com" />
        <link rel="prefetch" href="/listen" as="document" />
        <link rel="prefetch" href="/auth/inscription" as="document" />
      </head>
      <body className={`${montserrat.variable} antialiased`}>{children}</body>
    </html>
  );
}
