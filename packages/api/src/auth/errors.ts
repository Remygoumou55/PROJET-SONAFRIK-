import { AUTH_ERROR_MESSAGES } from "@sonafrik/types";

export class AuthError extends Error {
  readonly code: keyof typeof AUTH_ERROR_MESSAGES;

  constructor(code: keyof typeof AUTH_ERROR_MESSAGES, cause?: unknown) {
    super(AUTH_ERROR_MESSAGES[code]);
    this.name = "AuthError";
    this.code = code;
    if (cause instanceof Error) {
      this.cause = cause;
    }
  }
}

export function mapSupabaseAuthError(error: { message: string }): AuthError {
  const msg = error.message.toLowerCase();

  if (msg.includes("expired") || msg.includes("expir")) {
    return new AuthError("otp_expired", error);
  }
  if (msg.includes("invalid") || msg.includes("token")) {
    return new AuthError("otp_invalid", error);
  }
  if (msg.includes("network") || msg.includes("fetch")) {
    return new AuthError("network_error", error);
  }

  return new AuthError("unknown", error);
}
