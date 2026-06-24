"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { memo } from "react";
import { usePathname } from "next/navigation";
import { PlayerProvider } from "../lib/playerContext";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { QualityPreferenceProvider } from "@/lib/qualityPreferenceContext";
import { DevAuthBootstrap } from "@/features/auth/components/DevAuthBootstrap";
import type { AudioQualityPreference } from "@sonafrik/types";

const WebPlayer = dynamic(
  () => import("./WebPlayer").then((m) => ({ default: m.WebPlayer })),
  { ssr: false },
);

const NAV_ITEMS = [
  { href: "/listen",        label: "Accueil",      icon: "home" },
  { href: "/search",        label: "Explorer",     icon: "search" },
  { href: "/library",       label: "Bibliothèque", icon: "library" },
  { href: "/notifications", label: "Alertes",      icon: "bell" },
  { href: "/profile",       label: "Profil",       icon: "profile" },
] as const;

function isNavActive(href: string, pathname: string) {
  return pathname.startsWith(href);
}

const NavIcon = memo(function NavIcon({ icon, size = 22 }: { icon: string; size?: number }) {
  if (icon === "home") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12L12 4l9 8" />
        <path d="M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" />
      </svg>
    );
  }
  if (icon === "search") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="11" cy="11" r="7" />
        <path d="M16.5 16.5L21 21" />
      </svg>
    );
  }
  if (icon === "library") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M4 19V6a1 1 0 011-1h3a1 1 0 011 1v13" />
        <path d="M4 19h6" />
        <path d="M12.5 19V9.5l8 2.5V19" />
        <path d="M12.5 19h8" />
        <circle cx="7" cy="3.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (icon === "bell") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    );
  }
  if (icon === "profile") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    );
  }
  return null;
});

function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "flex items-baseline gap-0.5" : "flex flex-col items-start"}>
      <span className={`font-extrabold tracking-tight leading-none ${compact ? "text-xl" : "text-2xl"}`}>
        <span style={{ color: "var(--color-texte-principal)" }}>SONA</span>
        <span style={{ color: "var(--color-vert-energie)" }}>FRIK</span>
      </span>
      {!compact && (
        <span
          className="text-[9px] font-bold tracking-[0.2em] mt-1 block"
          style={{ color: "var(--color-or-solaire)" }}
        >
          NOTRE BIEN COMMUN
        </span>
      )}
    </div>
  );
}

function DesktopNav({
  userId,
  initialUnreadCount,
}: {
  userId: string;
  initialUnreadCount: number;
}) {
  const pathname = usePathname();
  return (
    <nav
      className="hidden md:flex w-64 flex-shrink-0 flex-col gap-1 p-4 h-screen sticky top-0"
      style={{ backgroundColor: "var(--color-surface)", borderRight: "1px solid var(--color-bordure)" }}
    >
      <div className="mb-8 px-3 pt-3">
        <BrandLogo />
      </div>
      {NAV_ITEMS.map((item) => {
        const isActive = isNavActive(item.href, pathname);
        if (item.icon === "bell") {
          return (
            <div
              key={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
              style={{
                backgroundColor: isActive ? "rgba(0,210,106,0.09)" : "transparent",
                color: isActive ? "var(--color-vert-energie)" : "var(--color-texte-secondaire)",
              }}
            >
              <NotificationBell
                initialCount={initialUnreadCount}
                userId={userId}
              />
              <span className="text-sm font-medium">{item.label}</span>
            </div>
          );
        }
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
            style={{
              backgroundColor: isActive ? "rgba(0,210,106,0.09)" : "transparent",
              color: isActive ? "var(--color-vert-energie)" : "var(--color-texte-secondaire)",
            }}
          >
            <NavIcon icon={item.icon} />
            <span className="text-sm font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function MobileBottomNav({
  userId,
  initialUnreadCount,
}: {
  userId: string;
  initialUnreadCount: number;
}) {
  const pathname = usePathname();
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-1 py-2"
      style={{
        backgroundColor: "var(--color-surface)",
        borderTop: "1px solid var(--color-elevated)",
        height: "64px",
      }}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = isNavActive(item.href, pathname);
        if (item.icon === "bell") {
          return (
            <div
              key={item.href}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1"
            >
              <NotificationBell initialCount={initialUnreadCount} userId={userId} />
              <span
                className="text-[9px] font-semibold tracking-wide"
                style={{ color: isActive ? "var(--color-vert-energie)" : "var(--color-texte-desactive)" }}
              >
                Alertes
              </span>
            </div>
          );
        }
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch
            className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-lg transition-colors"
            style={{ color: isActive ? "var(--color-vert-energie)" : "var(--color-texte-desactive)" }}
          >
            <NavIcon icon={item.icon} size={20} />
            <span
              className="text-[9px] font-semibold tracking-wide"
              style={{ color: isActive ? "var(--color-vert-energie)" : "var(--color-texte-desactive)" }}
            >
              {item.label === "Bibliothèque" ? "Biblio" : item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

interface StreamingLayoutClientProps {
  children: React.ReactNode;
  userId: string;
  initialUnreadCount: number;
  audioQualityPreference: AudioQualityPreference;
}

export function StreamingLayoutClient({
  children,
  userId,
  initialUnreadCount,
  audioQualityPreference,
}: StreamingLayoutClientProps) {
  return (
    <QualityPreferenceProvider value={audioQualityPreference}>
    <DevAuthBootstrap />
    <PlayerProvider>
      {/*
       * Layout unique responsive — {children} rendu UNE SEULE fois.
       * Desktop (md+) : flex-row, sidebar fixe + main scrollable.
       * Mobile (<md)  : block, main plein-écran + bottom nav fixe.
       */}
      <div style={{ backgroundColor: "var(--color-noir-profond)", minHeight: "100dvh" }}>
        <div className="md:flex md:h-screen md:overflow-hidden">
          {/* Sidebar — hidden sur mobile (hidden md:flex géré dans DesktopNav) */}
          <DesktopNav userId={userId} initialUnreadCount={initialUnreadCount} />

          {/* Contenu principal — pb-40 mobile (player+nav), pb-24 desktop */}
          <main className="flex-1 overflow-y-auto pb-40 md:pb-24 md:min-h-screen">
            {children}
          </main>
        </div>

        {/* Navigation bottom — fixe sur mobile, cachée sur desktop (md:hidden dans MobileBottomNav) */}
        <MobileBottomNav userId={userId} initialUnreadCount={initialUnreadCount} />
      </div>

      <WebPlayer />
    </PlayerProvider>
    </QualityPreferenceProvider>
  );
}
