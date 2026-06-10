import type { ReactNode } from "react";
import { IdentityNav } from "./IdentityNav";

interface IdentityShellProps {
  activePath: string;
  unreadNotifications?: number;
  title: string;
  description?: string;
  children: ReactNode;
}

export function IdentityShell({
  activePath,
  unreadNotifications,
  title,
  description,
  children,
}: IdentityShellProps) {
  return (
    <div className="min-h-screen bg-noir-profond">
      <header className="border-b border-bordure px-6 py-4">
        <p className="text-or-solaire text-xs font-semibold uppercase tracking-wider">
          NOTRE BIEN COMMUN
        </p>
        <h1 className="text-texte-principal mt-1 text-2xl font-bold">{title}</h1>
        {description ? (
          <p className="text-texte-secondaire mt-1 text-sm">{description}</p>
        ) : null}
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-8 lg:flex-row">
        <aside className="lg:w-56 lg:shrink-0">
          <IdentityNav activePath={activePath} unreadNotifications={unreadNotifications} />
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
