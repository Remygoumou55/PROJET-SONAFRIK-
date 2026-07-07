"use client";

import type { MusicNavRole } from "./musicNavTypes";

const ROLE_COPY: Record<
  MusicNavRole,
  { eyebrow: string; hint: string }
> = {
  artist: {
    eyebrow: "Ta carrière",
    hint: "Crée, diffuse et comprends ton impact.",
  },
  listener: {
    eyebrow: "Découverte",
    hint: "Écoute le meilleur de la scène.",
  },
  admin: {
    eyebrow: "Plateforme",
    hint: "Santé, modération et flux en direct.",
  },
  governance: {
    eyebrow: "Gouvernance",
    hint: "Pilotage stratégique SONAFRIK.",
  },
};

interface Props {
  role: MusicNavRole;
  pulse?: string;
}

export function MusicSidebarStory({ role, pulse }: Props) {
  const copy = ROLE_COPY[role];
  return (
    <div className="music-sidebar__story" aria-label="Contexte navigation">
      <p className="music-sidebar__story-eyebrow">{copy.eyebrow}</p>
      <p className="music-sidebar__story-hint">{pulse ?? copy.hint}</p>
    </div>
  );
}
