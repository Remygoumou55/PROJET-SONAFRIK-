"use client";

import Link from "next/link";
import { memo, useMemo } from "react";
import { usePathname } from "next/navigation";
import { usePerformanceFlags } from "@/lib/performance/performance-context";
import { useSmartPrefetch } from "@/lib/performance/smart-prefetch";

const NAV_ITEMS = [
  { href: "/listen", label: "Accueil", icon: "home" },
  { href: "/search", label: "Explorer", icon: "search" },
  { href: "/library", label: "Bibliothèque", icon: "library" },
  { href: "/wallet", label: "Wallet", icon: "wallet" },
  { href: "/profile", label: "Profil", icon: "profile" },
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
  if (icon === "wallet") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
        <path d="M3 7h18" />
        <path d="M16 12h2a2 2 0 0 1 0 4h-2" />
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

export function MobileBottomNav() {
  const pathname = usePathname();
  const { routePrefetchEnabled } = usePerformanceFlags();
  const navHrefs = useMemo(() => NAV_ITEMS.map((item) => item.href), []);
  const { prefetchOnHover } = useSmartPrefetch(navHrefs, { enabled: routePrefetchEnabled });

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-1 safe-px"
      style={{
        backgroundColor: "var(--color-surface)",
        borderTop: "1px solid var(--color-elevated)",
        minHeight: "var(--listener-bottom-nav-h)",
        paddingBottom: "var(--safe-bottom)",
        paddingTop: "0.5rem",
      }}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = isNavActive(item.href, pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={routePrefetchEnabled}
            onTouchStart={() => prefetchOnHover(item.href)}
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
