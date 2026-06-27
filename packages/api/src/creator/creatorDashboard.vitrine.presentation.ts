import type { ArtistProfile, Creator } from "@sonafrik/types";

export interface HeroVitrineBadge {
  id: string;
  label: string;
  tone: "online" | "default" | "verified";
}

export function formatMemberSince(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

export function resolveArtistTypeLabel(creator: Creator): string {
  return creator.label_id ? "Artiste label" : "Artiste indépendant";
}

export function buildHeroVitrineBadges(input: {
  artistProfile: ArtistProfile;
  profilePercent: number;
  profileCreatedAt: string;
}): HeroVitrineBadge[] {
  const { artistProfile, profilePercent, profileCreatedAt } = input;

  const badges: HeroVitrineBadge[] = [
    { id: "online", label: "En ligne", tone: "online" },
    { id: "profile", label: `Profil ${profilePercent} %`, tone: "default" },
    {
      id: "member",
      label: `Membre depuis ${formatMemberSince(profileCreatedAt)}`,
      tone: "default",
    },
  ];

  if (artistProfile.verified) {
    badges.push({ id: "verified", label: "✓ Vérifié", tone: "verified" });
  }

  return badges;
}
