/** Utilitaires partagés SONAFRIK */

export function formatGnf(amount: number): string {
  return new Intl.NumberFormat("fr-FR").format(Math.round(amount)) + " GNF";
}

export function isValidListenProgress(progressPercent: number): boolean {
  return progressPercent >= 90;
}

// ─── Téléphone Guinée ───────────────────────────────────────────
/** +224 suivi de 9 chiffres — ex. +224624000001 */
export const GUINEAN_PHONE_REGEX = /^\+224\d{9}$/;

export const GUINEAN_PHONE_ERROR =
  "Numéro invalide. Format attendu : +224XXXXXXXXX";

export const GUINEAN_PHONE_FORMAT_HINT =
  "Format attendu : +224 suivi de 8 à 9 chiffres (ex: +22464XXXXXXX)";

export function isValidGuineanPhone(phone: string): boolean {
  return GUINEAN_PHONE_REGEX.test(phone.trim());
}

/** Chiffres nationaux saisis après le préfixe +224. */
export function guineanNationalDigitCount(phone: string): number {
  const match = phone.trim().match(/^\+224(\d*)/);
  return match?.[1]?.length ?? 0;
}

/** Masque un numéro guinéen pour l'affichage (ex. +224 6X XXX XX 42). */
export function maskGuineanPhone(phone: string): string {
  const match = phone.trim().match(/^\+224(\d+)$/);
  const national = match?.[1];
  if (!national || national.length < 2) return "+224 ** *** ** **";
  const last2 = national.slice(-2);
  const first = national.slice(0, 1);
  return `+224 ${first}X XXX XX ${last2}`;
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
  PLAYLIST_TITLE: 60,
  PLAYLIST_DESCRIPTION: 200,
} as const;
