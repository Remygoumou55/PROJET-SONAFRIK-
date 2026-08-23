import type { Metadata } from "next";
import Link from "next/link";
import { AuthPageShell } from "@/features/identity/auth/components/AuthPageShell";
import { resolveAuthFeatureFlags } from "@/lib/auth/auth-feature-flags";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Besoin d'aide ? — SONAFRIK",
  description: "Assistance connexion SONAFRIK — Google et support.",
};

export default async function MotDePasseOubliePage() {
  const supabase = await getSupabaseServerClient();
  const { phoneAuthEnabled } = await resolveAuthFeatureFlags(supabase);

  return (
    <AuthPageShell
      title="Besoin d'aide ?"
      subtitle={
        phoneAuthEnabled
          ? "SONAFRIK vous connecte avec Google ou par SMS"
          : "Connectez-vous en un clic avec votre compte Google"
      }
    >
      <div className="space-y-6">
        <div
          className="space-y-4 rounded-xl p-5"
          style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-elevated)" }}
        >
          <div className="flex items-start gap-3">
            <div
              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: "color-mix(in srgb, var(--color-or-solaire) 12%, transparent)" }}
              aria-hidden
            >
              <span className="text-sm">G</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--t8-pearl)]">Connexion avec Google</p>
              <p className="mt-1 text-sm text-[var(--t8-silver)]">
                Cliquez sur « Continuer avec Google », choisissez votre compte et autorisez
                SONAFRIK. Votre profil est créé automatiquement à la première connexion.
              </p>
            </div>
          </div>

          {phoneAuthEnabled ? (
            <div className="flex items-start gap-3">
              <div
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: "color-mix(in srgb, var(--color-vert-energie) 12%, transparent)" }}
                aria-hidden
              >
                <span className="text-sm">📱</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--t8-pearl)]">Connexion par SMS</p>
                <p className="mt-1 text-sm text-[var(--t8-silver)]">
                  Entrez votre numéro guinéen (+224) et saisissez le code reçu par SMS. Chaque code
                  est valide quelques minutes.
                </p>
              </div>
            </div>
          ) : null}
        </div>

        <Link
          href="/auth/connexion"
          className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ backgroundColor: "var(--color-vert-energie)", color: "var(--color-noir-profond)" }}
        >
          Retour à la connexion
        </Link>

        <p className="text-center text-sm text-[var(--t8-silver-deep)]">
          Toujours bloqué ?{" "}
          <a
            href="mailto:support@sonafrik.com"
            className="text-[var(--t8-silver)] hover:underline"
          >
            Contacter le support
          </a>
        </p>
      </div>
    </AuthPageShell>
  );
}
