/** Utilitaires partagés SONAFRIK */

export function formatGnf(amount: number): string {
  return new Intl.NumberFormat("fr-GN", {
    style: "currency",
    currency: "GNF",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function isValidListenProgress(progressPercent: number): boolean {
  return progressPercent >= 90;
}

// ─── Téléphone Guinée ───────────────────────────────────────────
/** +224 suivi de 9 chiffres — ex. +224624000001 */
export const GUINEAN_PHONE_REGEX = /^\+224\d{9}$/;

export const GUINEAN_PHONE_ERROR =
  "Numéro invalide. Format attendu : +224XXXXXXXXX";

export function isValidGuineanPhone(phone: string): boolean {
  return GUINEAN_PHONE_REGEX.test(phone.trim());
}

// ─── Limites de longueur des champs ────────────────────────────
export const FIELD_LIMITS = {
  FULL_NAME: 80,
  BIO: 300,
  STAGE_NAME: 100,
  ARTIST_BIO: 300,
  ALBUM_TITLE: 100,
  TRACK_TITLE: 100,
  LABEL_NAME: 80,
  LABEL_DESCRIPTION: 300,
  CITY: 80,
} as const;
