"use client";

import { useState } from "react";
import { useAuthService } from "../hooks/useAuth";

interface GoogleAuthButtonProps {
  label?: string;
  role?: "artist" | "listener";
}

export function GoogleAuthButton({
  label = "Continuer avec Google",
  role,
}: GoogleAuthButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const auth = useAuthService();

  async function handleGoogleAuth() {
    setLoading(true);
    setError(null);
    // NEXT_PUBLIC_APP_URL fixe l'URL stable (prod Vercel) pour éviter que les
    // URLs de preview changeantes soient rejetées par Supabase Redirect URLs
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
    const roleParam = role ? `?role=${role}` : "";
    try {
      await auth.signInWithGoogle(`${appUrl}/auth/callback${roleParam}`);
      // Si pas d'erreur, le navigateur est redirigé vers Google — pas besoin de setLoading(false)
    } catch {
      setError("Erreur de connexion Google. Réessayez.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleGoogleAuth}
        disabled={loading}
        className="flex w-full items-center justify-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors disabled:opacity-60"
        style={{
          backgroundColor: "var(--color-card)",
          border: "1px solid var(--color-bordure)",
          color: "var(--color-texte-principal)",
        }}
      >
        {loading ? (
          <div
            className="h-5 w-5 rounded-full border-2 animate-spin"
            style={{ borderColor: "var(--color-texte-desactive)", borderTopColor: "var(--color-texte-principal)" }}
          />
        ) : (
          <GoogleIcon />
        )}
        {loading ? "Redirection…" : label}
      </button>
      {error && (
        <p className="text-xs text-center" style={{ color: "var(--color-erreur)" }}>
          {error}
        </p>
      )}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}
