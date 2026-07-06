import type { ModeConfig } from "./useDayMode.types";

export function getDayMode(hour: number): ModeConfig {
  if (hour >= 5 && hour < 12) {
    return {
      mode: "morning",
      label: "Matin",
      emoji: "☀️",
      greeting: "Bonjour",
      musicMood: "Musique éveillée et rythmée",
      headerAccent: "var(--day-accent-morning)",
    };
  }
  if (hour >= 12 && hour < 18) {
    return {
      mode: "afternoon",
      label: "Après-midi",
      emoji: "🎵",
      greeting: "Bon après-midi",
      musicMood: "Afrobeat et rythmes africains",
      headerAccent: "var(--day-accent-day)",
    };
  }
  if (hour >= 18 && hour < 22) {
    return {
      mode: "evening",
      label: "Soir",
      emoji: "🌆",
      greeting: "Bonsoir",
      musicMood: "Soul guinéenne et sons doux",
      headerAccent: "var(--day-accent-evening)",
    };
  }
  return {
    mode: "night",
    label: "Nuit",
    emoji: "🌙",
    greeting: "Bonne nuit",
    musicMood: "Musique douce pour la nuit",
    headerAccent: "var(--day-accent-night)",
  };
}
