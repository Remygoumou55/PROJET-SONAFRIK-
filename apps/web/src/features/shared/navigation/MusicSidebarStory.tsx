
import type { MusicNavRole } from "./musicNavTypes";

const ROLE_COPY: Record<
  MusicNavRole,
  { eyebrow: string; hint: string }
> = {
  artist: {
    eyebrow: "Ta carriÃ¨re",
    hint: "CrÃ©e, diffuse et comprends ton impact.",
  },
  listener: {
    eyebrow: "DÃ©couverte",
    hint: "Ã‰coute le meilleur de la scÃ¨ne.",
  },
  admin: {
    eyebrow: "Plateforme",
    hint: "SantÃ©, modÃ©ration et flux en direct.",
  },
  governance: {
    eyebrow: "Gouvernance",
    hint: "Pilotage stratÃ©gique SONAFRIK.",
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
