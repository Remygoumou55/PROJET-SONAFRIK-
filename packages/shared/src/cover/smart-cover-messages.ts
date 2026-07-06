/** Messages utilisateur — Smart Cover Engine (aucun jargon technique). */

export const SMART_COVER_MESSAGES = {
  ready: "Votre pochette est prête.",
  optimized: "Nous avons optimisé automatiquement votre image.",
  smallCompatible: "Votre image est un peu petite mais reste compatible.",
  qualityFailed:
    "Nous n'avons pas réussi à générer une pochette de qualité. Veuillez choisir une autre image.",
  processing: "SONAFRIK prépare votre pochette…",
  uploadFailed:
    "Nous n'avons pas réussi à enregistrer votre pochette. Veuillez réessayer.",
  formatUnsupported:
    "Ce format d'image n'est pas pris en charge. Utilisez JPG, PNG ou WebP.",
  fileTooLarge: (maxLabel: string) =>
    `Cette image est trop lourde. Taille maximum : ${maxLabel}.`,
} as const;

const TECHNICAL_PATTERNS: Array<{ pattern: RegExp; message: string }> = [
  { pattern: /image_load|canvas_|blob_failed/i, message: SMART_COVER_MESSAGES.qualityFailed },
  { pattern: /edge function|functions\.invoke/i, message: SMART_COVER_MESSAGES.uploadFailed },
  { pattern: /network|fetch failed|failed to fetch/i, message: SMART_COVER_MESSAGES.uploadFailed },
  { pattern: /storage|payload|asset/i, message: SMART_COVER_MESSAGES.uploadFailed },
  { pattern: /http\s*\d{3}/i, message: SMART_COVER_MESSAGES.uploadFailed },
];

export function mapCoverErrorToUserMessage(error: unknown, maxLabel = "10 Mo"): string {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  for (const { pattern, message } of TECHNICAL_PATTERNS) {
    if (pattern.test(raw)) return message;
  }
  if (/format non support/i.test(raw)) return SMART_COVER_MESSAGES.formatUnsupported;
  if (/trop lourd|too large|max/i.test(raw)) return SMART_COVER_MESSAGES.fileTooLarge(maxLabel);
  if (raw.trim().length > 0 && !/[{}[\]"]/.test(raw) && raw.length < 120) return raw;
  return SMART_COVER_MESSAGES.uploadFailed;
}
