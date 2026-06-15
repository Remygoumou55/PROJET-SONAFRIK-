"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PlayerProvider } from "../lib/playerContext";
import { WebPlayer } from "./WebPlayer";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";

const NAV_ITEMS = [
  { href: "/listen",        label: "Accueil",      icon: "home" },
  { href: "/search",        label: "Explorer",     icon: "search" },
  { href: "/library",       label: "Bibliothèque", icon: "library" },
  { href: "/notifications", label: "Alertes",      icon: "bell" },
  { href: "/profile",       label: "Profil",       icon: "profile" },
] as const;

function isNavActive(href: string, pathname: string) {
  if (href === "/listen") return pathname === "/listen" || pathname === "/";
  return pathname.startsWith(href);
}

function NavIcon({ icon, size = 22 }: { icon: string; size?: number }) {
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
}

function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "flex items-baseline gap-0.5" : "flex flex-col items-start"}>
      <span className={`font-extrabold tracking-tight leading-none ${compact ? "text-xl" : "text-2xl"}`}>
        <span style={{ color: "#FFFFFF" }}>SONA</span>
        <span style={{ color: "#00D26A" }}>FRIK</span>
      </span>
      {!compact && (
        <span
          className="text-[9px] font-bold tracking-[0.2em] mt-1 block"
          style={{ color: "#FFC20E" }}
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
      style={{ backgroundColor: "#1A1A1A", borderRight: "1px solid #333333" }}
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
                backgroundColor: isActive ? "#00D26A18" : "transparent",
                color: isActive ? "#00D26A" : "#A0A0A0",
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
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
            style={{
              backgroundColor: isActive ? "#00D26A18" : "transparent",
              color: isActive ? "#00D26A" : "#A0A0A0",
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
        backgroundColor: "#1A1A1A",
        borderTop: "1px solid #2A2A2A",
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
                style={{ color: isActive ? "#00D26A" : "#555555" }}
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
            className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-lg transition-colors"
            style={{ color: isActive ? "#00D26A" : "#555555" }}
          >
            <NavIcon icon={item.icon} size={20} />
            <span
              className="text-[9px] font-semibold tracking-wide"
              style={{ color: isActive ? "#00D26A" : "#555555" }}
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
}

export function StreamingLayoutClient({
  children,
  userId,
  initialUnreadCount,
}: StreamingLayoutClientProps) {
  return (
    <PlayerProvider>
      {/* ── Desktop : sidebar + main ──────────────────────── */}
      <div
        className="hidden md:flex h-screen overflow-hidden"
        style={{ backgroundColor: "#0D0D0D" }}
      >
        <DesktopNav userId={userId} initialUnreadCount={initialUnreadCount} />
        <main className="flex-1 overflow-y-auto pb-24">{children}</main>
      </div>

      {/* ── Mobile : plein écran + bottom nav fixe ────────── */}
      <div
        className="md:hidden min-h-screen"
        style={{ backgroundColor: "#0D0D0D" }}
      >
        <main className="pb-40">{children}</main>
        <MobileBottomNav userId={userId} initialUnreadCount={initialUnreadCount} />
      </div>

      <WebPlayer />
    </PlayerProvider>
  );
}
