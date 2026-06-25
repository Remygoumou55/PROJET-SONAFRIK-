import type { ArtistTier, CreatorStatus } from "@sonafrik/types";

const TIER_LABELS: Record<ArtistTier, string> = {
  emergent: "Artiste émergent",
  croissance: "En croissance",
  etabli: "Artiste établi",
};

const STATUS_LABELS: Record<CreatorStatus, string> = {
  draft: "Profil en cours",
  active: "Actif",
  suspended: "Suspendu",
};

export function getArtistTierLabel(tier: ArtistTier): string {
  return TIER_LABELS[tier] ?? tier;
}

export function getCreatorStatusLabel(status: CreatorStatus): string {
  return STATUS_LABELS[status] ?? status;
}
