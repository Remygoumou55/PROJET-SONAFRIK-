"use client";

import type { ReactNode } from "react";
import { SonafrikLogo } from "@/components/shared/SonafrikLogo";

interface AuthPageShellProps {
  title: string;
  subtitle?: string;
  /** Contenu au-dessus du header (ex. lien retour) — slot stable pour éviter hydration mismatch */
  leading?: ReactNode;
  /** Classe additionnelle sur le conteneur */
  className?: string;
  children: ReactNode;
}

export function AuthPageShell({ title, subtitle, leading, className, children }: AuthPageShellProps) {
  return (
    <div className={`app-page-content app-page-stack w-full max-w-md space-y-8 ${className ?? ""}`.trim()}>
      {leading ? <div>{leading}</div> : null}
      <header className="text-center">
        <div className="mb-4 flex justify-center">
          <SonafrikLogo variant="full" priority />
        </div>
        <h1 className="app-page-title text-2xl font-bold text-texte-principal">{title}</h1>
        {subtitle ? (
          <p className="app-page-subtitle mt-1 text-sm text-texte-secondaire">{subtitle}</p>
        ) : null}
      </header>
      {children}
    </div>
  );
}
