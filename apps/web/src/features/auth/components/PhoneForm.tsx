"use client";

import { useState } from "react";
import { Button, Input } from "@sonafrik/ui";
import { AuthError } from "@sonafrik/api/auth";

interface PhoneFormProps {
  onSubmit: (phone: string) => Promise<void>;
  submitLabel?: string;
  defaultPhone?: string;
}

export function PhoneForm({
  onSubmit,
  submitLabel = "Recevoir le code SMS",
  defaultPhone = "+224",
}: PhoneFormProps) {
  const [phone, setPhone] = useState(defaultPhone);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onSubmit(phone);
    } catch (err) {
      setError(err instanceof AuthError ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-4">
      <Input
        label="Numéro de téléphone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="+224620000000"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        hint="Format international — Guinée : +224"
        required
      />
      {error ? (
        <p className="text-sm text-red-500" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" fullWidth isLoading={loading}>
        {submitLabel}
      </Button>
    </form>
  );
}
