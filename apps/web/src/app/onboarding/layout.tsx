import type { ReactNode } from "react";
import { AmbientBackgroundGlow } from "@/components/shared/AmbientBackgroundGlow";

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app-page-shell">
      <AmbientBackgroundGlow />
      <div className="app-page-main">{children}</div>
    </div>
  );
}
