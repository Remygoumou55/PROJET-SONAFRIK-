"use client";

import Link from "next/link";
import { getInitials } from "@/lib/utils";
import { useDayMode } from "../hooks/useDayMode";
import { ProverbeJour } from "./ProverbeJour";
import { NightModeBanner } from "./NightModeBanner";

interface ListenHeroGreetingProps {
  fullName: string | null;
  unreadNotifications: number;
  compactActions?: boolean;
}

export function ListenHeroGreeting({
  fullName,
  unreadNotifications,
  compactActions = false,
}: ListenHeroGreetingProps) {
  const { greeting, emoji, headerAccent } = useDayMode();
  const firstName = fullName?.split(" ")[0] ?? "là";

  return (
    <>
      <div
        className="flex items-start justify-between mb-6 relative z-10"
        style={{ background: `linear-gradient(90deg, ${headerAccent}, transparent)` }}
      >
        <div>
          <p className="listen-greeting-label">SONAFRIK</p>
          <h1 className="listen-greeting-title">
            {greeting},<br />
            <span className="listen-greeting-name">
              {firstName} {emoji}
            </span>
          </h1>
          <p className="listen-greeting-sub">Découvrez la musique africaine</p>
          <ProverbeJour />
        </div>
        {!compactActions ? (
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
              {unreadNotifications > 0 ? (
                <div
                  className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                  style={{
                    background: "var(--color-erreur)",
                    fontSize: 7,
                    fontWeight: 800,
                    color: "white",
                    border: "1.5px solid var(--color-noir-profond)",
                  }}
                >
                  {unreadNotifications}
                </div>
              ) : null}
            </Link>
            <Link href="/profile">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-sm"
                style={{
                  background: "linear-gradient(135deg, var(--color-vert-energie), var(--color-vert-profond))",
                  color: "black",
                  boxShadow: "0 0 14px rgba(0, 210, 106, 0.4)",
                }}
              >
                {getInitials(fullName ?? firstName)}
              </div>
            </Link>
          </div>
        ) : null}
      </div>
      <NightModeBanner />
    </>
  );
}
