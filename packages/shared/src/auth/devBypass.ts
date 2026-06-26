/** Bypass dev local — jamais actif sur Vercel. Source unique pour services API. */
export function isDevBypassActive(): boolean {
  return (
    (process.env.BYPASS_AUTH === "true" && process.env.VERCEL !== "1") ||
    process.env.NEXT_PUBLIC_LOCAL_AUDIT_MODE === "true"
  );
}

export function assertBypassForbiddenOnVercel(): void {
  if (process.env.BYPASS_AUTH === "true" && process.env.VERCEL === "1") {
    throw new Error("BYPASS_AUTH ne doit jamais être actif en production");
  }
}

export const DEV_MOCK_USER_ID = "dev-mock-id";
