import type { ReactNode } from "react";
import { AmbientBackgroundGlow } from "@/components/shared/AmbientBackgroundGlow";

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-noir-profond">
      <AmbientBackgroundGlow />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
