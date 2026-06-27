/**
 * Mode Live Control local — bypass auth + aucune redirection auto vers /listen.
 * Jamais actif sur Vercel. Source unique pour middleware, guards et services API.
 */
export function isLocalControlMode(): boolean {
  if (process.env.VERCEL === "1") return false;
  return (
    process.env.BYPASS_AUTH === "true" ||
    process.env.LOCAL_CONTROL_MODE === "true" ||
    process.env.NEXT_PUBLIC_LOCAL_AUDIT_MODE === "true" ||
    process.env.NEXT_PUBLIC_LOCAL_CONTROL_MODE === "true"
  );
}

/** Alias historique — même comportement que isLocalControlMode(). */
export function isDevBypassActive(): boolean {
  return isLocalControlMode();
}

/** Côté client (ConnexionPageClient, etc.) — lit uniquement les NEXT_PUBLIC_*. */
export function isClientLocalControlMode(): boolean {
  return (
    process.env.NEXT_PUBLIC_BYPASS_AUTH === "true" ||
    process.env.NEXT_PUBLIC_LOCAL_AUDIT_MODE === "true" ||
    process.env.NEXT_PUBLIC_LOCAL_CONTROL_MODE === "true"
  );
}

export function assertBypassForbiddenOnVercel(): void {
  if (process.env.BYPASS_AUTH === "true" && process.env.VERCEL === "1") {
    throw new Error("BYPASS_AUTH ne doit jamais être actif en production");
  }
}

export const DEV_MOCK_USER_ID = "dev-mock-id";
