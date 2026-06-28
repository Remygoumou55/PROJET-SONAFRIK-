import type { ReactNode } from "react";
import { IdentityNav } from "./IdentityNav";
import { IdentityMobileNav } from "./IdentityMobileNav";

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
    <div className="identity-shell">
      <header className="identity-shell__header">
        <p className="identity-shell__eyebrow">NOTRE BIEN COMMUN</p>
        <h1 className="identity-shell__title">{title}</h1>
        {description ? (
          <p className="identity-shell__description">{description}</p>
        ) : null}
      </header>

      <IdentityMobileNav activePath={activePath} unreadNotifications={unreadNotifications} />

      <div className="identity-shell__layout">
        <aside className="identity-shell__aside" aria-label="Navigation du profil">
          <IdentityNav activePath={activePath} unreadNotifications={unreadNotifications} />
        </aside>
        <main className="identity-shell__main">{children}</main>
      </div>
    </div>
  );
}
