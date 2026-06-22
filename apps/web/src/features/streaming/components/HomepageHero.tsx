"use client";

import Link from "next/link";
import { getInitials } from "@/lib/utils";

interface HomepageHeroProps {
  fullName: string | null;
  greeting: string;
  proverb: { text: string; origin: string };
  unreadNotifications: number;
}

export function HomepageHero({ fullName, greeting, proverb, unreadNotifications }: HomepageHeroProps) {
  const firstName = fullName?.split(" ")[0] ?? "là";

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

      <div className="flex items-start justify-between mb-6 relative z-10">
        <div>
          <p className="text-xs font-semibold mb-1 tracking-widest uppercase" style={{ color: "var(--color-vert-energie)" }}>
            SONAFRIK
          </p>
          <h1 className="text-2xl font-extrabold leading-tight" style={{ color: "var(--color-texte-principal)" }}>
            {greeting},<br />
            <span style={{ color: "var(--color-vert-energie)" }}>{firstName} 👋</span>
          </h1>
          <p className="text-sm mt-1.5" style={{ color: "var(--color-texte-subtil)" }}>
            Découvrez la musique africaine
          </p>
          <p className="text-xs mt-2 italic leading-relaxed" style={{ color: "var(--color-texte-secondaire)" }}>
            🌍 &ldquo;{proverb.text}&rdquo;
            <span className="not-italic block text-[10px] mt-0.5" style={{ color: "var(--color-texte-subtil)" }}>
              — {proverb.origin}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <Link
            href="/notifications"
            className="relative"
            aria-label={`Notifications${unreadNotifications > 0 ? ` (${unreadNotifications} non lues)` : ""}`}
          >
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="var(--color-texte-desactive)" strokeWidth="1.8">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadNotifications > 0 && (
              <div
                className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                style={{ background: "var(--color-erreur)", fontSize: 7, fontWeight: 800, color: "white", border: "1.5px solid var(--color-noir-profond)" }}
              >
                {unreadNotifications}
              </div>
            )}
          </Link>
          <Link href="/profile">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-sm"
              style={{
                background: "linear-gradient(135deg, var(--color-vert-energie), var(--color-vert-profond))",
                color: "black",
                boxShadow: "0 0 14px rgba(0,210,106,0.4)",
              }}
            >
              {getInitials(fullName ?? firstName)}
            </div>
          </Link>
        </div>
      </div>

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
        <span className="text-sm" style={{ color: "var(--color-texte-desactive)" }}>Artiste, chanson, album…</span>
        <div
          className="ml-auto px-2.5 py-1 rounded-lg text-[10px] font-bold"
          style={{ background: "rgba(0, 210, 106, 0.09)", color: "var(--color-vert-energie)", border: "1px solid rgba(0, 210, 106, 0.20)" }}
        >
          Chercher
        </div>
      </Link>
    </div>
  );
}
