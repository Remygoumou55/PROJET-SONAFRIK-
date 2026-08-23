import type { ReactNode } from "react";
import { AmbientBackgroundGlow } from "@/components/shared/AmbientBackgroundGlow";

interface LandingPageProps {
  children: ReactNode;
}

export function LandingPage({ children }: LandingPageProps) {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-[var(--t8-deep-black)]">
      <AmbientBackgroundGlow />
      <div className="relative z-[1] mx-auto max-w-[960px] px-6 pb-16">{children}</div>
    </div>
  );
}
