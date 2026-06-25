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

/** Erreurs Supabase lors de l'envoi du SMS OTP (signInWithOtp). */
export function mapSupabaseOtpSendError(error: { message: string }): AuthError {
  const msg = error.message.toLowerCase();

  if (msg.includes("phone") && msg.includes("invalid")) {
    return new AuthError("invalid_phone", error);
  }
  if (
    msg.includes("sms")
    || msg.includes("provider")
    || msg.includes("twilio")
    || msg.includes("disabled")
    || msg.includes("not enabled")
  ) {
    return new AuthError("otp_send_failed", error);
  }
  if (msg.includes("rate") || msg.includes("too many") || msg.includes("429")) {
    return new AuthError("otp_rate_limited", error);
  }
  if (msg.includes("network") || msg.includes("fetch")) {
    return new AuthError("network_error", error);
  }

  return new AuthError("otp_send_failed", error);
}

/** Erreurs Supabase lors de la vérification du code OTP (verifyOtp). */
export function mapSupabaseOtpVerifyError(error: { message: string }): AuthError {
  const msg = error.message.toLowerCase();

  if (msg.includes("expired") || msg.includes("expir")) {
    return new AuthError("otp_expired", error);
  }
  if (msg.includes("invalid") || msg.includes("token") || msg.includes("otp")) {
    return new AuthError("otp_invalid", error);
  }
  if (msg.includes("network") || msg.includes("fetch")) {
    return new AuthError("network_error", error);
  }

  return new AuthError("otp_invalid", error);
}

/** @deprecated Préférer mapSupabaseOtpSendError ou mapSupabaseOtpVerifyError */
export function mapSupabaseAuthError(error: { message: string }): AuthError {
  return mapSupabaseOtpVerifyError(error);
}
