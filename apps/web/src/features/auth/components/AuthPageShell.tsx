import type { ReactNode } from "react";

interface AuthPageShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function AuthPageShell({ title, subtitle, children }: AuthPageShellProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-8">
        <header className="text-center">
          <div className="mb-4">
            <p className="text-2xl font-extrabold tracking-tight leading-none">
              <span style={{ color: "var(--color-texte-principal)" }}>SONA</span>
              <span style={{ color: "var(--color-vert-energie)" }}>FRIK</span>
            </p>
            <p className="text-[9px] font-bold tracking-[0.2em] mt-1" style={{ color: "var(--color-or-solaire)" }}>
              NOTRE BIEN COMMUN
            </p>
          </div>
          <h1 className="text-2xl font-bold text-texte-principal">{title}</h1>
          {subtitle && (
            <p className="mt-1 text-sm text-texte-secondaire">{subtitle}</p>
          )}
        </header>
        {children}
      </div>
    </main>
  );
}
