/** Normalise toute erreur wizard — évite l'affichage "[object Event]" en prod/dev. */
export function wizardErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message.trim()) return err.message;
  if (typeof err === "string" && err.trim()) return err;
  return fallback;
}

/** Exécute une promesse sans rejection non gérée (overlay Next.js). */
export function runWizardTask(task: () => Promise<void>): void {
  void task().catch(() => undefined);
}
