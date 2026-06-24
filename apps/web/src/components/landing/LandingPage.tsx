import type { ReactNode } from "react";
import { AmbientBackgroundGlow } from "@/components/shared/AmbientBackgroundGlow";

interface LandingPageProps {
  children: ReactNode;
}

export function LandingPage({ children }: LandingPageProps) {
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        backgroundColor: "var(--color-noir-profond)",
        minHeight: "100vh",
      }}
    >
      <AmbientBackgroundGlow />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: "960px",
          margin: "0 auto",
          padding: "0 24px 64px",
        }}
      >
        {children}
      </div>
    </div>
  );
}
