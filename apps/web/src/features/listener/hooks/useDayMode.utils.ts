import type { ModeConfig } from "./useDayMode.types";

export function getDayMode(hour: number): ModeConfig {
  if (hour >= 5 && hour < 12) {
    return {
      mode: "morning",
      label: "Matin",
      emoji: "☀️",
      greeting: "Bonjour",
      musicMood: "Musique éveillée et rythmée",
      headerAccent: "rgba(255, 194, 14, 0.15)",
    };
  }
  if (hour >= 12 && hour < 18) {
    return {
      mode: "afternoon",
      label: "Après-midi",
      emoji: "🎵",
      greeting: "Bon après-midi",
      musicMood: "Afrobeat et rythmes africains",
      headerAccent: "rgba(0, 210, 106, 0.1)",
    };
  }
  if (hour >= 18 && hour < 22) {
    return {
      mode: "evening",
      label: "Soir",
      emoji: "🌆",
      greeting: "Bonsoir",
      musicMood: "Soul guinéenne et sons doux",
      headerAccent: "rgba(120, 60, 0, 0.15)",
    };
  }
  return {
    mode: "night",
    label: "Nuit",
    emoji: "🌙",
    greeting: "Bonne nuit",
    musicMood: "Musique douce pour la nuit",
    headerAccent: "rgba(30, 0, 80, 0.2)",
  };
}
