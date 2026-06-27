interface ShareTrackOptions {
  trackId: string;
  title: string;
  artistName: string;
  baseUrl?: string;
}

function getTrackShareUrl(trackId: string, baseUrl: string): string {
  return `${baseUrl}/listen/track/${trackId}`;
}

export function generateWhatsAppShareUrl(options: ShareTrackOptions): string {
  const baseUrl = options.baseUrl ?? "https://sonafrik.vercel.app";
  const trackUrl = getTrackShareUrl(options.trackId, baseUrl);
  const message = encodeURIComponent(
    `🎵 J'écoute "${options.title}" de ${options.artistName} sur SONAFRIK !\n` +
      `La musique guinéenne mérite sa plateforme 🇬🇳\n\n` +
      `Écoute ici : ${trackUrl}\n\n` +
      `📱 Télécharge SONAFRIK — Notre Bien Commun`,
  );
  return `https://wa.me/?text=${message}`;
}

export async function shareTrack(options: ShareTrackOptions): Promise<void> {
  const baseUrl = options.baseUrl ?? (typeof window !== "undefined" ? window.location.origin : "https://sonafrik.vercel.app");
  const trackUrl = getTrackShareUrl(options.trackId, baseUrl);

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({
        title: `${options.title} — ${options.artistName} sur SONAFRIK`,
        text: `J'écoute "${options.title}" de ${options.artistName} sur SONAFRIK ! La musique guinéenne mérite sa plateforme 🇬🇳`,
        url: trackUrl,
      });
      return;
    } catch {
      // Annulation ou erreur → fallback WhatsApp
    }
  }

  window.open(generateWhatsAppShareUrl({ ...options, baseUrl }), "_blank", "noopener,noreferrer");
}
