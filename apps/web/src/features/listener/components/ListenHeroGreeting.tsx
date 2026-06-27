"use client";

import { useDayMode } from "../hooks/useDayMode";
import { ProverbeJour } from "./ProverbeJour";
import { NightModeBanner } from "./NightModeBanner";

interface ListenHeroGreetingProps {
  fullName: string | null;
}

export function ListenHeroGreeting({ fullName }: ListenHeroGreetingProps) {
  const { greeting, emoji } = useDayMode();
  const firstName = fullName?.split(" ")[0] ?? "là";

  return (
    <>
      <div className="listen-hero-text relative z-10">
        <h1 className="listen-hero-greeting">
          {greeting},<br />
          <span className="listen-hero-name">
            {firstName} {emoji}
          </span>
        </h1>
        <p className="listen-hero-sub">Découvrez la musique africaine</p>
        <ProverbeJour />
      </div>
      <NightModeBanner />
    </>
  );
}
