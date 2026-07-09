"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { LdseDevPanel } from "@/features/shared/ldse/LdseDevPanel";
import { LdseProvider } from "@/features/shared/ldse/LdseProvider";
import { registerLdseDomainRules } from "@/features/shared/ldse/registerDomainRules";
import { RootSrtspShell } from "@/features/shared/srtsp/RootSrtspShell";

const DEFERRED_LDSE_ROUTE = "/creator/catalog/tracks";

/** Enveloppe LDSE + SRTSP globale — Event Bus + Sync Engine sur toute l'app web. */
export function RootLdseShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== DEFERRED_LDSE_ROUTE) {
      registerLdseDomainRules();
      return;
    }

    const schedule =
      typeof window.requestIdleCallback === "function"
        ? window.requestIdleCallback(() => registerLdseDomainRules(), { timeout: 1200 })
        : window.setTimeout(() => registerLdseDomainRules(), 800);

    return () => {
      if (typeof schedule === "number") {
        window.clearTimeout(schedule);
        return;
      }
      window.cancelIdleCallback(schedule);
    };
  }, [pathname]);

  return (
    <RootSrtspShell>
      <LdseProvider>
        <LdseDevPanel />
        {children}
      </LdseProvider>
    </RootSrtspShell>
  );
}
