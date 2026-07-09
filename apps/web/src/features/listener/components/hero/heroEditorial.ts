import type { HeroItem } from "@sonafrik/types";

export interface HeroTheme {
  label: string;
  subtitle: string;
  badge: string | null;
  badgeVariant: "verified" | "trending" | "emerging" | "new";
}

/** Formate un compteur d'écoutes pour affichage compact. */
export function formatListenCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.floor(n / 1_000)}K`;
  return String(n);
}

const ARTIST_FALLBACK_THEMES: Array<{ label: string; subtitle: string }> = [
  { label: "🌍 La scène africaine",    subtitle: "Les voix qui définissent la musique africaine" },
  { label: "🎤 La révélation du moment", subtitle: "Des talents qui montent, à écouter maintenant" },
  { label: "🏆 La sélection SONAFRIK", subtitle: "Notre coup de cœur de la semaine" },
  { label: "✨ Le son de Conakry",      subtitle: "La scène musicale guinéenne en plein essor" },
  { label: "🎵 À découvrir maintenant", subtitle: "La prochaine grande voix de la scène africaine" },
];

const ALBUM_LABEL: Record<string, { label: string; subtitle: string }> = {
  single: { label: "🎵 Nouveau single",        subtitle: "La dernière sortie que vous ne devez pas manquer" },
  ep:     { label: "💿 Nouvel EP disponible",   subtitle: "Un projet compact, intense et à écouter sans pause" },
  album:  { label: "🎧 Nouvel album disponible", subtitle: "L'œuvre complète qui va faire parler d'elle" },
};

/** Dérive un thème éditorial data-driven depuis les métriques de l'item. */
export function getHeroTheme(item: HeroItem, slideIndex: number): HeroTheme {
  if (item.content_type === "album") {
    const releaseLabel =
      item.release_type === "ep" ? "EP" :
      item.release_type === "single" ? "SINGLE" :
      "ALBUM";
    const theme = ALBUM_LABEL[item.release_type] ?? ALBUM_LABEL.album!;
    const badgeVariant = item.verified ? "verified" : "new";
    const badge = item.verified ? `✓ ${releaseLabel}` : releaseLabel;
    return { ...theme, badge, badgeVariant };
  }

  // Artiste — thème data-driven selon listen_count + verified
  let label: string;
  let subtitle: string;
  let badge: string;
  let badgeVariant: HeroTheme["badgeVariant"];

  if (item.verified && item.listen_count > 5000) {
    label = "🏆 Artiste incontournable";
    subtitle = "Définit le son de la scène africaine aujourd'hui";
    badge = "✓ VÉRIFIÉ";
    badgeVariant = "verified";
  } else if (item.listen_count > 10000) {
    label = "🔥 En tête des écoutes";
    subtitle = `${formatListenCount(item.listen_count)} écoutes sur SONAFRIK`;
    badge = "🔥 TENDANCE";
    badgeVariant = "trending";
  } else if (item.listen_count > 2000) {
    label = "🚀 En pleine ascension";
    subtitle = "Un talent qui monte fort sur la scène africaine";
    badge = "MONTÉE";
    badgeVariant = "emerging";
  } else if (item.listen_count > 200) {
    label = "🎵 À découvrir maintenant";
    subtitle = "La prochaine révélation de la scène guinéenne";
    badge = "ÉMERGENT";
    badgeVariant = "emerging";
  } else if (item.verified) {
    label = "⭐ Artiste officiel SONAFRIK";
    subtitle = "Sélectionné et vérifié par notre équipe éditoriale";
    badge = "✓ VÉRIFIÉ";
    badgeVariant = "verified";
  } else {
    const fallback = ARTIST_FALLBACK_THEMES[slideIndex % ARTIST_FALLBACK_THEMES.length]!;
    label = fallback.label;
    subtitle = fallback.subtitle;
    badge = "NOUVEAU";
    badgeVariant = "new";
  }

  return { label, subtitle, badge, badgeVariant };
}
