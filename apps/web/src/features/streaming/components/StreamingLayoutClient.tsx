"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PlayerProvider } from "../lib/playerContext";
import { WebPlayer } from "./WebPlayer";

const NAV_ITEMS = [
  { href: "/listen", label: "Accueil", icon: "home" },
  { href: "/search", label: "Recherche", icon: "search" },
  { href: "/library", label: "Bibliothèque", icon: "library" },
] as const;

function NavIcon({ icon }: { icon: string }) {
  if (icon === "home") {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
        <path d="M2 8.5L10 2l8 6.5V18a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V8.5z" stroke="currentColor" strokeWidth="1.2" fill="none" />
        <path d="M7 19v-7h6v7" stroke="currentColor" strokeWidth="1.2" fill="none" />
      </svg>
    );
  }
  if (icon === "search") {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
        <path d="M13.5 13.5L18 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path d="M4 5h12M4 10h8M4 15h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function StreamingNav() {
  const pathname = usePathname();
  return (
    <nav
      className="w-64 flex-shrink-0 flex flex-col gap-1 p-4"
      style={{ backgroundColor: "#1A1A1A", borderRight: "1px solid #333333" }}
    >
      <div className="mb-6 px-3">
        <span className="text-lg font-bold" style={{ color: "#FFFFFF" }}>
          SONA<span style={{ color: "#00D26A" }}>FRIK</span>
        </span>
      </div>
      {NAV_ITEMS.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors"
            style={{
              backgroundColor: isActive ? "#00D26A1A" : "transparent",
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

export function StreamingLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <PlayerProvider>
      <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#0D0D0D" }}>
        <StreamingNav />
        <main className="flex-1 overflow-y-auto pb-24">
          {children}
        </main>
      </div>
      <WebPlayer />
    </PlayerProvider>
  );
}
