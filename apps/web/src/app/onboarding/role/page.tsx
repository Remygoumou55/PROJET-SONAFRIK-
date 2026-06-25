"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { OnboardingPageShell } from "@/components/onboarding/OnboardingPageShell";
import { useAuthService } from "@/features/auth/hooks/useAuth";
import { ROLE_ICONS, RoleSelectionCard } from "./RoleSelectionCard";

const ROLES = [
  {
    value: "listener" as const,
    accountType: "auditeur" as const,
    label: "Auditeur",
    description: "Découvrir, écouter et soutenir les artistes guinéens",
    dest: "/onboarding/listener",
  },
  {
    value: "artist" as const,
    accountType: "artiste" as const,
    label: "Artiste",
    description: "Publier mes morceaux et toucher mes revenus",
    dest: "/onboarding/artist",
  },
] as const;

const BACK_LINK = (
  <Link
    href="/auth/connexion"
    className="inline-flex text-sm transition-colors hover:underline"
    style={{ color: "var(--color-texte-secondaire)" }}
  >
    ← Retour
  </Link>
);

export default function RolePage() {
  const router = useRouter();
  const auth = useAuthService();
  const [loading, setLoading] = useState<"listener" | "artist" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSelect(role: (typeof ROLES)[number]) {
    setLoading(role.value);
    setError(null);
    try {
      await auth.setAccountType(role.accountType);
      router.push(role.dest);
    } catch {
      setError("Une erreur est survenue. Réessayez.");
      setLoading(null);
    }
  }

  return (
    <OnboardingPageShell
      leading={BACK_LINK}
      stepLabel="Étape 1 · Choisir votre profil"
      title="Comment voulez-vous utiliser SONAFRIK ?"
      subtitle="Vous pourrez changer de mode plus tard."
    >
      <div className="flex flex-col gap-3">
        {ROLES.map((role) => (
          <RoleSelectionCard
            key={role.value}
            icon={ROLE_ICONS[role.value]}
            label={role.label}
            description={role.description}
            accent={role.value}
            loading={loading === role.value}
            disabled={loading !== null}
            dimmed={loading !== null && loading !== role.value}
            onSelect={() => handleSelect(role)}
          />
        ))}
      </div>

      {error ? (
        <p className="mt-4 text-center text-sm text-erreur" role="alert">
          {error}
        </p>
      ) : null}
    </OnboardingPageShell>
  );
}
