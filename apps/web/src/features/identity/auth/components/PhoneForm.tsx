"use client";

import { useState } from "react";
import { Input } from "@sonafrik/ui";
import { AuthError } from "@sonafrik/api/auth";
import {
  GUINEAN_PHONE_FORMAT_HINT,
  guineanNationalDigitCount,
  isValidGuineanPhone,
} from "@sonafrik/shared";

interface PhoneFormProps {
  onSubmit: (phone: string) => Promise<void>;
  submitLabel?: string;
  defaultPhone?: string;
  submitDisabled?: boolean;
  onBlockedSubmit?: () => void;
}

/** Force le préfixe +224 et ne garde que les chiffres guinéens. */
function formatGuineanPhoneInput(raw: string): string {
  const digits = raw.replace(/\D/g, "");

  if (!digits.length) return "+224";

  if (digits.startsWith("224")) {
    return `+${digits.slice(0, 12)}`;
  }

  if (digits.startsWith("0")) {
    return `+224${digits.slice(1, 10)}`;
  }

  return `+224${digits.slice(0, 9)}`;
}

function phoneInputVariant(
  phone: string,
  showInvalid: boolean,
): "default" | "success" | "error" {
  if (showInvalid && !isValidGuineanPhone(phone)) return "error";
  const digitCount = guineanNationalDigitCount(phone);
  if (digitCount >= 8 && isValidGuineanPhone(phone)) return "success";
  return "default";
}

export function PhoneForm({
  onSubmit,
  submitLabel = "Recevoir le code SMS",
  defaultPhone = "+224",
  submitDisabled = false,
  onBlockedSubmit,
}: PhoneFormProps) {
  const [phone, setPhone] = useState(defaultPhone);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const inputVariant = phoneInputVariant(phone, submitAttempted);
  const showValidIcon = inputVariant === "success";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitAttempted(true);

    if (submitDisabled) {
      onBlockedSubmit?.();
      return;
    }

    setError(null);

    if (!isValidGuineanPhone(phone)) {
      setError(GUINEAN_PHONE_FORMAT_HINT);
      return;
    }

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
        maxLength={13}
        value={phone}
        variant={inputVariant}
        onChange={(e) => {
          setPhone(formatGuineanPhoneInput(e.target.value));
          if (error) setError(null);
        }}
        onFocus={() => {
          if (phone === "") setPhone("+224");
        }}
        hint="Format international — Guinée : +224XXXXXXXXX"
        error={error ?? undefined}
        readOnly={loading}
        required
        suffix={
          showValidIcon ? (
            <span
              className="text-sm font-semibold"
              style={{ color: "var(--color-vert-energie)" }}
              aria-hidden="true"
            >
              ✓
            </span>
          ) : undefined
        }
      />
      <button
        type="submit"
        disabled={loading}
        aria-disabled={submitDisabled || loading}
        className={`flex w-full min-h-[44px] items-center justify-center gap-2 rounded-lg text-sm transition-all duration-300 sm:text-base ${
          submitDisabled
            ? "cursor-not-allowed bg-[var(--t8-primary-lavender)]/30 font-semibold text-white/40"
            : "cursor-pointer bg-[var(--t8-primary-lavender)] font-bold text-[var(--t8-deep-black)]"
        }`}
      >
        {loading ? (
          <>
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
              aria-hidden="true"
            />
            Envoi en cours…
          </>
        ) : (
          submitLabel
        )}
      </button>
    </form>
  );
}
