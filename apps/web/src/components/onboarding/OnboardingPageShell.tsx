"use client";

import type { ReactNode } from "react";
import { SonafrikLogo } from "@/components/shared/SonafrikLogo";
import { OnboardingStepPill } from "./OnboardingStepPill";

interface OnboardingPageShellProps {
  title: string;
  subtitle?: string;
  stepLabel?: string;
  leading?: ReactNode;
  children: ReactNode;
}

/** Shell onboarding aligné sur AuthPageShell — logo centré, contenu structuré. */
export function OnboardingPageShell({
  title,
  subtitle,
  stepLabel,
  leading,
  children,
}: OnboardingPageShellProps) {
  return (
    <div className="app-page-content w-full max-w-md space-y-6">
      {leading ? <div>{leading}</div> : null}

      <header className="text-center">
        <div className="mb-4">
          <SonafrikLogo />
          <p className="brand-logo-tagline">Notre Bien Commun</p>
        </div>
        {stepLabel ? <OnboardingStepPill label={stepLabel} /> : null}
        <h1 className="app-page-title text-2xl font-bold text-texte-principal sm:text-[26px]">
          {title}
        </h1>
        {subtitle ? (
          <p className="app-page-subtitle mt-2 text-sm text-texte-secondaire">{subtitle}</p>
        ) : null}
      </header>

      <div className="rounded-2xl border border-bordure bg-card/90 p-4 shadow-lg backdrop-blur-sm sm:p-5">
        {children}
      </div>
    </div>
  );
}
