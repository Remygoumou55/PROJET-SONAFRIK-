import type { ReactNode } from "react";
import { IdentityNav } from "./IdentityNav";
import { IdentityMobileNav } from "./IdentityMobileNav";
import { MusicHeader } from "@/features/shared/navigation";

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
    <div className="enterprise-shell enterprise-shell--identity identity-shell">
      <div className="enterprise-sidebar-card enterprise-sidebar-card--compact">
        <IdentityNav activePath={activePath} unreadNotifications={unreadNotifications} />
      </div>

      <div className="enterprise-main-column flex-1 min-w-0">
        <MusicHeader
          className="identity-shell__header"
          eyebrow="NOTRE BIEN COMMUN"
          title={title}
          subtitle={description}
        />

        <IdentityMobileNav activePath={activePath} unreadNotifications={unreadNotifications} />

        <div className="identity-shell__layout flex-1 min-h-0">
          <aside className="identity-shell__aside" aria-label="Navigation du profil">
            <IdentityNav activePath={activePath} unreadNotifications={unreadNotifications} />
          </aside>
          <main className="enterprise-content-card identity-shell__main">
            <div className="enterprise-content-card__inner">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
