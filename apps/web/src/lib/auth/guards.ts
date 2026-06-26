import {
  assertBypassForbiddenOnVercel,
  DEV_MOCK_USER_ID,
  isDevBypassActive,
} from "@sonafrik/shared/auth";

export { assertBypassForbiddenOnVercel, DEV_MOCK_USER_ID, isDevBypassActive };

/** Middleware uniquement — BYPASS_AUTH sans LOCAL_AUDIT_MODE. */
export function isMiddlewareBypassActive(): boolean {
  return process.env.BYPASS_AUTH === "true" && process.env.VERCEL !== "1";
}
