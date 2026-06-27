const INSPIRATION_MESSAGES = [
  "Chaque artiste commence par un premier pas.",
  "Votre musique mérite d'être entendue.",
  "Votre aventure musicale continue.",
  "La scène guinéenne vous attend.",
  "Votre voix compte dans notre bien commun.",
  "Un morceau à la fois, une histoire entière.",
] as const;

export interface ProfileGreetingParts {
  greeting: string;
  emoji: string;
}

export function getProfileGreetingParts(hour: number): ProfileGreetingParts {
  if (hour >= 5 && hour < 12) {
    return { greeting: "Bonjour", emoji: "👋" };
  }
  if (hour >= 12 && hour < 18) {
    return { greeting: "Bon après-midi", emoji: "☀️" };
  }
  return { greeting: "Bonsoir", emoji: "🌙" };
}

export function getProfileInspirationMessage(date = new Date()): string {
  const index = (date.getDate() + date.getMonth() * 31) % INSPIRATION_MESSAGES.length;
  return INSPIRATION_MESSAGES[index] ?? INSPIRATION_MESSAGES[0];
}
