"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { LdseDevPanel, LdseProvider } from "@/features/shared/ldse";
import { registerLdseDomainRules } from "@/features/shared/ldse/registerDomainRules";

/** Enveloppe LDSE globale — Event Bus + cache partagés sur toute l'app web. */
export function RootLdseShell({ children }: { children: ReactNode }) {
  useEffect(() => {
    registerLdseDomainRules();
  }, []);

  return (
    <LdseProvider>
      <LdseDevPanel />
      {children}
    </LdseProvider>
  );
}
