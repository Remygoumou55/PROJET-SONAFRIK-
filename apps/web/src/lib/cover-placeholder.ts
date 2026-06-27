import { CARD_GRADIENTS } from "@/lib/constants";
import { getInitials } from "@/lib/utils";

/** Index déterministe — même nom = même dégradé. */
export function getGradientSeedFromName(name: string | undefined | null, fallback = 0): number {
  if (!name?.trim()) return fallback;
  const charSum = name.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return charSum % CARD_GRADIENTS.length;
}

export function getArtistGradientStyle(name: string | undefined | null, fallbackSeed = 0): string {
  const gradient = CARD_GRADIENTS[getGradientSeedFromName(name, fallbackSeed)]!;
  return `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%)`;
}

export function getCoverInitials(name: string | undefined | null): string {
  if (!name?.trim()) return "🎵";
  return getInitials(name);
}
