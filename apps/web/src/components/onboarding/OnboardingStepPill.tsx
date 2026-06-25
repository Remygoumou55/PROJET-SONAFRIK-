interface OnboardingStepPillProps {
  label: string;
}

/** Indicateur d'étape compact pour les écrans d'onboarding. */
export function OnboardingStepPill({ label }: OnboardingStepPillProps) {
  return (
    <span className="mb-4 inline-flex items-center rounded-full border border-vert-energie/25 bg-vert-energie/10 px-3 py-1 text-xs font-medium text-vert-energie">
      {label}
    </span>
  );
}
