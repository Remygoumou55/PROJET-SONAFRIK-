interface OnboardingStepPillProps {
  label: string;
}

/** Indicateur d'étape compact pour les écrans d'onboarding. */
export function OnboardingStepPill({ label }: OnboardingStepPillProps) {
  return (
    <span className="mb-4 inline-flex items-center rounded-full border border-[var(--t8-primary-lavender)]/25 bg-[var(--t8-primary-lavender)]/10 px-3 py-1 text-xs font-medium text-[var(--t8-primary-lavender)]">
      {label}
    </span>
  );
}
