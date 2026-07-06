import type { ReactNode } from "react";

/** Layer 1 — shell RSC minimal (prefetch + enveloppe sans providers client). */
export function ListenerLayoutShell({ children }: { children: ReactNode }) {
  return (
    <>
      <link rel="prefetch" href="/library" as="document" />
      <link rel="prefetch" href="/search" as="document" />
      {children}
    </>
  );
}
