/** Résultat standard des server actions admin (jamais throw côté client). */
export type AdminActionResult<T extends Record<string, unknown> = Record<string, unknown>> = {
  error?: string;
} & T;

export const ADMIN_ACTION_FALLBACK_ERROR = "Erreur lors de l'action.";
