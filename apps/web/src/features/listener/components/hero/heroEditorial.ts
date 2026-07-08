import type { HeroItem } from "@sonafrik/types";

export interface HeroTheme {
  label: string;
  subtitle: string;
  badge: string | null;
}

const ARTIST_THEMES = [
  {
    label: "🔥 Les tendances en Guinée",
    subtitle: "Les artistes qui font vibrer la scène musicale",
  },
  {
    label: "⭐ Le son du moment",
    subtitle: "Plongez dans la musique africaine d'aujourd'hui",
  },
  {
    label: "🎵 En pleine ascension",
    subtitle: "Des talents qui montent, à découvrir maintenant",
  },
  {
    label: "🏆 La sélection SONAFRIK",
    subtitle: "Notre coup de cœur de la semaine",
  },
  {
    label: "🌍 La scène africaine",
    subtitle: "Les voix qui définissent la musique africaine",
  },
];

const ALBUM_THEMES = [
  {
    label: "🎧 Nouvel album disponible",
    subtitle: "La dernière sortie que vous ne devez pas manquer",
  },
  {
    label: "📀 Nouveautés",
    subtitle: "Découvrez les projets les plus récents",
  },
  {
    label: "🚀 Sortie récente",
    subtitle: "Un nouveau projet qui mérite votre attention",
  },
];

/** Dérive un thème éditorial déterministe depuis l'index de slide (stable entre rendus). */
export function getHeroTheme(item: HeroItem, slideIndex: number): HeroTheme {
  if (item.content_type === "album") {
    const theme = ALBUM_THEMES[slideIndex % ALBUM_THEMES.length]!;
    const releaseLabel =
      item.release_type === "ep" ? "EP" :
      item.release_type === "single" ? "Single" :
      "Album";
    return { ...theme, badge: releaseLabel.toUpperCase() };
  }

  const theme = ARTIST_THEMES[slideIndex % ARTIST_THEMES.length]!;
  let badge: string | null = null;
  if (item.verified) badge = "VÉRIFIÉ";
  else if (item.listen_count > 500) badge = "EN TENDANCE";
  else if (item.listen_count > 0) badge = "ARTISTE ÉMERGENT";
  else badge = "À DÉCOUVRIR";

  return { ...theme, badge };
}
