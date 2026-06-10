"use client";

import { useState } from "react";
import { Button, Input } from "@sonafrik/ui";
import { AuthError } from "@sonafrik/api/auth";

interface OtpFormProps {
  phone: string;
  onSubmit: (token: string) => Promise<void>;
  onResend: () => Promise<void>;
}

export function OtpForm({ phone, onSubmit, onResend }: OtpFormProps) {
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

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
    setError(null);
    setResending(true);
    try {
      await onResend();
    } catch (err) {
      setError(err instanceof AuthError ? err.message : "Impossible de renvoyer le code.");
    } finally {
      setResending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-4">
      <p className="text-center text-sm text-texte-secondaire">
        Code envoyé au <span className="text-texte-principal">{phone}</span>
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
        <p className="text-sm text-red-500" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" fullWidth isLoading={loading}>
        Vérifier
      </Button>
      <Button type="button" variant="ghost" fullWidth isLoading={resending} onClick={handleResend}>
        Renvoyer le code
      </Button>
    </form>
  );
}
