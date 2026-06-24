import type { LandingPublicStats } from "@/lib/landing/constants";

export function LiveStatsSkeleton() {
  return (
    <div
      className="landing-live-stats-skeleton"
      style={{
        borderTop: "1px solid rgba(0,210,106,0.15)",
        borderBottom: "1px solid rgba(0,210,106,0.15)",
        backgroundColor: "rgba(0,210,106,0.06)",
        padding: "16px",
        marginBottom: "48px",
        minHeight: "72px",
      }}
      aria-hidden="true"
    />
  );
}

export type { LandingPublicStats };
