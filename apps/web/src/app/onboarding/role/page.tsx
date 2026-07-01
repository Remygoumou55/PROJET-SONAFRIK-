"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { OnboardingPageShell } from "@/components/onboarding/OnboardingPageShell";
import { useAuthService } from "@/features/identity/auth/hooks/useAuth";
import { JourneyDoorCard, type JourneyDoorKind } from "./JourneyDoorCard";

const JOURNEYS = [
  {
    kind: "artist" as const,
    accountType: "artiste" as const,
    heading: "JE SUIS UN ARTISTE",
    subtitle: "Votre musique mérite d'être entendue.",
    benefits: [
      "Publier mes morceaux",
      "Recevoir mes revenus",
      "Construire ma carrière",
      "Développer ma communauté",
    ],
    ctaLabel: "Commencer ma carrière →",
    dest: "/onboarding/artist",
  },
  {
    kind: "listener" as const,
    accountType: "auditeur" as const,
    heading: "JE SUIS UN AUDITEUR",
    subtitle: "Découvrez les talents de Guinée.",
    benefits: [
      "Explorer la musique",
      "Créer mes playlists",
      "Soutenir les artistes",
      "Découvrir les nouveautés",
    ],
    ctaLabel: "Commencer l'écoute →",
    dest: "/onboarding/listener",
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
  const [selected, setSelected] = useState<JourneyDoorKind | null>(null);
  const [loading, setLoading] = useState<JourneyDoorKind | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = useCallback(
    async (journey: (typeof JOURNEYS)[number]) => {
      if (loading) return;
      setLoading(journey.kind);
      setError(null);
      try {
        await auth.setAccountType(journey.accountType);
        router.push(journey.dest);
      } catch {
        setError("Une erreur est survenue. Réessayez.");
        setLoading(null);
      }
    },
    [auth, loading, router],
  );

  return (
    <OnboardingPageShell leading={BACK_LINK} title="" wide bare>
      <div className="onboarding-journey">
        <header className="onboarding-journey__hero">
          <p className="onboarding-journey__tagline">La musique commence par un choix.</p>
          <h1 className="onboarding-journey__title">
            Quelle sera votre place dans l&apos;histoire de la musique guinéenne ?
          </h1>
          <p className="onboarding-journey__hint">Vous pourrez changer de mode plus tard.</p>
        </header>

        <div
          className="onboarding-journey__grid"
          role="group"
          aria-label="Choisissez votre aventure musicale"
        >
          {JOURNEYS.map((journey) => (
            <JourneyDoorCard
              key={journey.kind}
              kind={journey.kind}
              heading={journey.heading}
              subtitle={journey.subtitle}
              benefits={journey.benefits}
              ctaLabel={journey.ctaLabel}
              selected={selected === journey.kind}
              loading={loading === journey.kind}
              dimmed={loading !== null && loading !== journey.kind}
              onSelect={() => setSelected(journey.kind)}
              onContinue={() => {
                if (selected !== journey.kind) {
                  setSelected(journey.kind);
                }
                void handleContinue(journey);
              }}
            />
          ))}
        </div>

        <p className="onboarding-journey__footer">
          Chaque artiste que vous soutenez contribue au rayonnement de la musique guinéenne.
        </p>

        {error ? (
          <p className="text-center text-sm text-erreur" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </OnboardingPageShell>
  );
}
