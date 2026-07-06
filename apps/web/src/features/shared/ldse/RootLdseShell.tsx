"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { LdseDevPanel } from "@/features/shared/ldse/LdseDevPanel";
import { LdseProvider } from "@/features/shared/ldse/LdseProvider";
import { registerLdseDomainRules } from "@/features/shared/ldse/registerDomainRules";
import { RootSrtspShell } from "@/features/shared/srtsp/RootSrtspShell";

/** Enveloppe LDSE + SRTSP globale — Event Bus + Sync Engine sur toute l'app web. */
export function RootLdseShell({ children }: { children: ReactNode }) {
  useEffect(() => {
    registerLdseDomainRules();
  }, []);

  return (
    <RootSrtspShell>
      <LdseProvider>
        <LdseDevPanel />
        {children}
      </LdseProvider>
    </RootSrtspShell>
  );
}
