import type { Metadata } from "next";
import Link from "next/link";
import { AuthPageShell } from "@/features/auth/components/AuthPageShell";

export const metadata: Metadata = {
  title: "Accès à votre compte — SONAFRIK",
  description: "SONAFRIK ne nécessite pas de mot de passe. Connectez-vous avec votre numéro de téléphone.",
};

export default function MotDePasseOubliePage() {
  return (
    <AuthPageShell
      title="Pas de mot de passe ?"
      subtitle="SONAFRIK utilise votre téléphone pour vous identifier"
    >
      <div className="space-y-6">
        {/* Explication */}
        <div
          className="rounded-xl p-5 space-y-3"
          style={{ backgroundColor: "#1F1F1F", border: "1px solid #2A2A2A" }}
        >
          <div className="flex items-start gap-3">
            <div
              className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: "#00D26A18" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00D26A" strokeWidth="2" strokeLinecap="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .84h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.64a16 16 0 006.29 6.29l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: "#FFFFFF" }}>
                Connexion par SMS
              </p>
              <p className="text-sm mt-1" style={{ color: "#A0A0A0" }}>
                Entrez votre numéro de téléphone et recevez un code à usage unique. Aucun mot de passe à retenir.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div
              className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: "#00D26A18" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00D26A" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4l3 3" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: "#FFFFFF" }}>
                Code valide 10 minutes
              </p>
              <p className="text-sm mt-1" style={{ color: "#A0A0A0" }}>
                Chaque code est à usage unique et expire automatiquement.
              </p>
            </div>
          </div>
        </div>

        {/* CTA principal */}
        <Link
          href="/auth/connexion"
          className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#00D26A", color: "#0D0D0D" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" />
          </svg>
          Recevoir un code SMS
        </Link>

        <p className="text-center text-sm" style={{ color: "#555555" }}>
          Vous pouvez aussi{" "}
          <Link
            href="/auth/connexion"
            className="hover:underline"
            style={{ color: "#A0A0A0" }}
          >
            vous connecter avec Google
          </Link>
        </p>

        <p className="text-center text-sm" style={{ color: "#555555" }}>
          Toujours bloqué ?{" "}
          <a
            href="mailto:support@sonafrik.com"
            className="hover:underline"
            style={{ color: "#A0A0A0" }}
          >
            Contacter le support
          </a>
        </p>
      </div>
    </AuthPageShell>
  );
}
