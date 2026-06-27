"use client";

import Link from "next/link";
import { ListenHeroGreeting } from "./ListenHeroGreeting";

interface HomepageHeroProps {
  fullName: string | null;
  unreadNotifications: number;
  compactActions?: boolean;
}

export function HomepageHero({ fullName, unreadNotifications, compactActions = false }: HomepageHeroProps) {
  return (
    <div
      className="relative overflow-hidden px-6 pt-8 pb-10"
      style={{
        background: `
          radial-gradient(ellipse 80% 120% at 100% 50%, rgba(0,210,106,0.13) 0%, transparent 60%),
          radial-gradient(ellipse 50% 80% at 0% 100%, rgba(255,194,14,0.06) 0%, transparent 50%),
          linear-gradient(to bottom, var(--color-noir-profond), var(--color-noir-profond))
        `,
        borderBottom: "1px solid var(--color-surface)",
      }}
    >
      <div
        className="absolute right-0 top-1/2 -translate-y-1/2 w-64 h-64 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(0,210,106,0.12) 0%, transparent 70%)",
          filter: "blur(30px)",
        }}
      />

      <ListenHeroGreeting
        fullName={fullName}
        unreadNotifications={unreadNotifications}
        compactActions={compactActions}
      />

      <Link
        href="/search"
        className="flex items-center gap-3 px-4 py-3 rounded-2xl w-full relative z-10"
        style={{
          background: "var(--color-skeleton)",
          border: "1px solid var(--color-elevated)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
        }}
      >
        <svg width={16} height={16} viewBox="0 0 20 20" fill="none" stroke="var(--color-texte-desactive)" strokeWidth="2">
          <circle cx="8" cy="8" r="6" />
          <path d="M13 13L18 18" strokeLinecap="round" />
        </svg>
        <span className="text-sm" style={{ color: "var(--color-texte-desactive)" }}>
          Artiste, chanson, album…
        </span>
        <div
          className="ml-auto px-2.5 py-1 rounded-lg text-[10px] font-bold"
          style={{
            background: "rgba(0, 210, 106, 0.09)",
            color: "var(--color-vert-energie)",
            border: "1px solid rgba(0, 210, 106, 0.20)",
          }}
        >
          Chercher
        </div>
      </Link>
    </div>
  );
}
