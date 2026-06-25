import type { ReactNode } from "react";
import { AmbientBackgroundGlow } from "@/components/shared/AmbientBackgroundGlow";

interface LandingPageProps {
  children: ReactNode;
}

export function LandingPage({ children }: LandingPageProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-noir-profond">
      <AmbientBackgroundGlow />
      <div className="relative z-[1] mx-auto max-w-[960px] px-6 pb-16">{children}</div>
    </div>
  );
}
