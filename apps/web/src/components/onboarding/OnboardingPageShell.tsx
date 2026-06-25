"use client";

import type { ReactNode } from "react";
import { AuthBrandLogo } from "@/features/auth/components/AuthBrandLogo";
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
    <main className="flex min-h-screen flex-col items-center px-6 py-10 sm:py-12">
      <div className="w-full max-w-md space-y-6">
        {leading ? <div>{leading}</div> : null}

        <header className="text-center">
          <AuthBrandLogo />
          {stepLabel ? <OnboardingStepPill label={stepLabel} /> : null}
          <h1 className="text-2xl font-bold text-texte-principal sm:text-[26px]">{title}</h1>
          {subtitle ? (
            <p className="mt-2 text-sm text-texte-secondaire">{subtitle}</p>
          ) : null}
        </header>

        <div className="rounded-2xl border border-bordure bg-card/90 p-4 shadow-lg backdrop-blur-sm sm:p-5">
          {children}
        </div>
      </div>
    </main>
  );
}
