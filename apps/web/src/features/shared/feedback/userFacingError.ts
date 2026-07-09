/** Retire les détails techniques dev des messages affichés à l'utilisateur. */
export function stripDevErrorSuffix(message: string): string {
  return message.replace(/\s*\[dev:[^\]]*]\s*$/i, "").trim();
}

const AUTH_PATTERNS = [
  /session invalide/i,
  /accès non autorisé/i,
  /non autorisé/i,
  /unauthorized/i,
  /connectez-vous/i,
];

/** Message upload/image lisible — jamais de suffixe [dev: …] ni jargon edge function. */
export function toUserFacingUploadError(err: unknown, fallback: string): string {
  let message = fallback;

  if (err instanceof Error && err.message.trim()) {
    message = err.message;
  } else if (err && typeof err === "object" && "message" in err) {
    const raw = (err as { message: unknown }).message;
    if (typeof raw === "string" && raw.trim()) message = raw;
  }

  message = stripDevErrorSuffix(message);

  if (AUTH_PATTERNS.some((pattern) => pattern.test(message))) {
    return "Connectez-vous pour enregistrer vos images.";
  }

  if (/permission|autorisation/i.test(message)) {
    return "Vous n'avez pas l'autorisation d'enregistrer ce fichier.";
  }

  if (/connexion|network|réseau|instable/i.test(message)) {
    return "Votre connexion semble instable. Réessayez dans quelques instants.";
  }

  return message || fallback;
}
