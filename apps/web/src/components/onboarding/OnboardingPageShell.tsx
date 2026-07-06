import type { ReactNode } from "react";
import { SonafrikLogo } from "@/components/shared/SonafrikLogo";
import { OnboardingStepPill } from "./OnboardingStepPill";

interface OnboardingPageShellProps {
  title: string;
  subtitle?: string;
  stepLabel?: string;
  leading?: ReactNode;
  /** Layout large (ex. choix du parcours) */
  wide?: boolean;
  /** Sans carte interne — contenu pleine largeur */
  bare?: boolean;
  children: ReactNode;
}

/** Shell onboarding aligné sur AuthPageShell — logo centré, contenu structuré. */
export function OnboardingPageShell({
  title,
  subtitle,
  stepLabel,
  leading,
  wide = false,
  bare = false,
  children,
}: OnboardingPageShellProps) {
  const widthClass = wide ? "max-w-5xl" : "max-w-md";

  return (
    <div className={`app-page-content w-full ${widthClass} space-y-6`}>
      {leading ? <div>{leading}</div> : null}

      <header className="text-center">
        <div className="mb-4 flex justify-center">
          <SonafrikLogo variant="full" priority />
        </div>
        {stepLabel ? <OnboardingStepPill label={stepLabel} /> : null}
        {title ? (
          <h1 className="app-page-title text-2xl font-bold text-texte-principal sm:text-[26px]">
            {title}
          </h1>
        ) : null}
        {subtitle ? (
          <p className="app-page-subtitle mt-2 text-sm text-texte-secondaire">{subtitle}</p>
        ) : null}
      </header>

      {bare ? (
        children
      ) : (
        <div className="rounded-2xl border border-bordure bg-card/90 p-4 shadow-lg backdrop-blur-sm sm:p-5">
          {children}
        </div>
      )}
    </div>
  );
}
