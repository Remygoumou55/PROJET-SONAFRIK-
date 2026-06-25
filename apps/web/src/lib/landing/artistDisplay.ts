/** Palettes avatar landing — tokens Tailwind uniquement. */
export const LANDING_AVATAR_PALETTES = [
  { bg: "bg-vert-energie/20", text: "text-vert-energie", border: "border-vert-energie/35" },
  { bg: "bg-or-solaire/20", text: "text-or-solaire", border: "border-or-solaire/35" },
  { bg: "bg-accent-violet/20", text: "text-accent-violet-clair", border: "border-accent-violet/35" },
  { bg: "bg-feature-azure/20", text: "text-accent-bleu-clair", border: "border-feature-azure/35" },
  { bg: "bg-accent-orange/20", text: "text-accent-orange", border: "border-accent-orange/35" },
  { bg: "bg-feature-indigo/20", text: "text-feature-indigo", border: "border-feature-indigo/35" },
] as const;

export function getArtistInitials(stageName: string): string {
  const parts = stageName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

export function getAvatarPalette(index: number) {
  return LANDING_AVATAR_PALETTES[index % LANDING_AVATAR_PALETTES.length]!;
}
