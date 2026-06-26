import type { ArtistProfile, Creator } from "@sonafrik/types";

export interface ArtistHeroBadge {
  id: string;
  label: string;
  tone: "default" | "accent" | "verified";
}

export function formatMemberSince(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

export function accountStatusLabel(status: Creator["status"]): string {
  switch (status) {
    case "active":
      return "Compte actif";
    case "suspended":
      return "Compte suspendu";
    default:
      return "Profil en cours de configuration";
  }
}

export function buildArtistHeroBadges(input: {
  creator: Creator;
  artistProfile: ArtistProfile;
  profilePercent: number;
  profileCreatedAt: string;
}): ArtistHeroBadge[] {
  const { creator, artistProfile, profilePercent } = input;

  const badges: ArtistHeroBadge[] = [
    { id: "account", label: "Compte Artiste", tone: "accent" },
    {
      id: "type",
      label: creator.label_id ? "Artiste label" : "Artiste indépendant",
      tone: "default",
    },
    { id: "profile", label: `Profil ${profilePercent} %`, tone: "default" },
  ];

  if (artistProfile.verified) {
    badges.push({ id: "verified", label: "Compte Vérifié", tone: "verified" });
  }

  if (artistProfile.is_public) {
    badges.push({ id: "public", label: "Profil public", tone: "default" });
  }

  return badges;
}
