"use client";

import type { ReactNode } from "react";
import { LdseDevPanel, LdseProvider } from "@/features/shared/ldse";

/** Enveloppe LDSE globale — Event Bus + cache partagés sur toute l'app web. */
export function RootLdseShell({ children }: { children: ReactNode }) {
  return (
    <LdseProvider>
      <LdseDevPanel />
      {children}
    </LdseProvider>
  );
}
