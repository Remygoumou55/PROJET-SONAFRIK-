/** Session locale Publication Wizard — survit au refresh (sessionStorage). */

export const WIZARD_SESSION_STORAGE_KEY = "sonafrik:publication-wizard:v1";

export interface WizardSessionMeta {
  genreId: string;
  language: string;
  lyrics: string;
  explicit: boolean;
}

export interface WizardSessionRelease {
  albumId: string;
  trackId: string;
  title: string;
  creatorId: string;
}

export interface WizardSessionSnapshot {
  release: WizardSessionRelease;
  titleInput: string;
  filesCompleted: boolean;
  metadataCompleted: boolean;
  meta: WizardSessionMeta;
  step2Visited: boolean;
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof sessionStorage !== "undefined";
}

export function readWizardSession(): WizardSessionSnapshot | null {
  if (!isBrowser()) return null;
  try {
    const raw = sessionStorage.getItem(WIZARD_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WizardSessionSnapshot;
    if (!parsed?.release?.albumId || !parsed?.release?.trackId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeWizardSession(snapshot: WizardSessionSnapshot): void {
  if (!isBrowser()) return;
  try {
    sessionStorage.setItem(WIZARD_SESSION_STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    /* quota / mode privé — non bloquant */
  }
}

export function clearWizardSession(): void {
  if (!isBrowser()) return;
  try {
    sessionStorage.removeItem(WIZARD_SESSION_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
