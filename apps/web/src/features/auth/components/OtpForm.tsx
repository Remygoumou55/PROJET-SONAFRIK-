"use client";

import { useEffect, useState } from "react";
import { Button, Input } from "@sonafrik/ui";
import { AuthError } from "@sonafrik/api/auth";
import { maskGuineanPhone } from "@sonafrik/shared";

const OTP_RESEND_COOLDOWN_S = 30;

interface OtpFormProps {
  phone: string;
  onSubmit: (token: string) => Promise<void>;
  onResend: () => Promise<void>;
  onChangePhone?: () => void;
}

export function OtpForm({ phone, onSubmit, onResend, onChangePhone }: OtpFormProps) {
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(OTP_RESEND_COOLDOWN_S);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onSubmit(token);
    } catch (err) {
      setError(err instanceof AuthError ? err.message : "Code incorrect.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (cooldown > 0) return;
    setError(null);
    setResending(true);
    try {
      await onResend();
      setCooldown(OTP_RESEND_COOLDOWN_S);
    } catch (err) {
      setError(err instanceof AuthError ? err.message : "Impossible de renvoyer le code.");
    } finally {
      setResending(false);
    }
  }

  const maskedPhone = maskGuineanPhone(phone);

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-4">
      <p
        className="text-center"
        style={{ fontSize: "14px", color: "var(--color-vert-energie)" }}
        role="status"
      >
        ✓ Code envoyé au {maskedPhone}
      </p>
      <Input
        label="Code de vérification"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder="000000"
        maxLength={6}
        value={token}
        onChange={(e) => setToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
        required
      />
      {error ? (
        <p className="text-sm" role="alert" style={{ color: "var(--color-erreur)" }}>
          {error}
        </p>
      ) : null}
      <Button type="submit" fullWidth isLoading={loading}>
        Vérifier
      </Button>
      <p className="text-center text-sm" style={{ color: "var(--color-texte-secondaire)" }}>
        Pas reçu ?{" "}
        <button
          type="button"
          disabled={cooldown > 0 || resending}
          onClick={handleResend}
          className="transition-colors hover:underline disabled:cursor-not-allowed disabled:no-underline"
          style={{
            color: cooldown > 0 ? "var(--color-texte-desactive)" : "var(--color-vert-energie)",
          }}
        >
          {resending
            ? "Envoi…"
            : cooldown > 0
              ? `Renvoyer dans ${cooldown}s`
              : "Renvoyer le code"}
        </button>
      </p>
      {onChangePhone ? (
        <button
          type="button"
          onClick={onChangePhone}
          className="text-sm text-center transition-colors hover:underline"
          style={{ color: "var(--color-texte-secondaire)" }}
        >
          Changer de numéro
        </button>
      ) : null}
    </form>
  );
}
