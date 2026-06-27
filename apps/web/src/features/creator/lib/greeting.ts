export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Bonjour";
  if (hour >= 12 && hour < 18) return "Bon après-midi";
  return "Bonsoir";
}

export function getGreetingEmoji(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "☀️";
  if (hour >= 12 && hour < 18) return "🎵";
  return "🌙";
}

export function formatCreatorGreeting(stageName: string): string {
  return `${getGreeting()} ${stageName} ${getGreetingEmoji()}`;
}
