"use client";

import type { ReactNode } from "react";
import { AmbientBackgroundGlow } from "@/components/shared/AmbientBackgroundGlow";
import { AuthBrandLogo } from "./AuthBrandLogo";

interface AuthPageShellProps {
  title: string;
  subtitle?: string;
  /** Contenu au-dessus du header (ex. lien retour) — slot stable pour éviter hydration mismatch */
  leading?: ReactNode;
  children: ReactNode;
}

export function AuthPageShell({ title, subtitle, leading, children }: AuthPageShellProps) {
  return (
    <div
      className="relative min-h-screen"
      style={{ backgroundColor: "var(--color-noir-profond)" }}
    >
      <AmbientBackgroundGlow />
      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-8">
          {leading ? <div>{leading}</div> : null}
          <header className="text-center">
            <AuthBrandLogo />
            <h1 className="text-2xl font-bold text-texte-principal">{title}</h1>
            {subtitle ? (
              <p className="mt-1 text-sm text-texte-secondaire">{subtitle}</p>
            ) : null}
          </header>
          {children}
        </div>
      </main>
    </div>
  );
}
