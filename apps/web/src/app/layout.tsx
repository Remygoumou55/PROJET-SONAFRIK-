import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { SONAFRIK_BRAND } from "@sonafrik/types";
import "@sonafrik/ui/styles.css";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: `${SONAFRIK_BRAND.name} — ${SONAFRIK_BRAND.slogan}`,
  description:
    "Music Operating System Africain — Écouter, publier et monétiser la musique africaine.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${montserrat.variable} antialiased`}>{children}</body>
    </html>
  );
}
