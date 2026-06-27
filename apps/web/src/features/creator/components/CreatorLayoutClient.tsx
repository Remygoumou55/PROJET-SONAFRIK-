"use client";

import { usePathname } from "next/navigation";
import { SonafrikLogo } from "@/components/shared/SonafrikLogo";
import { CreatorNav } from "./CreatorNav";
import { CreatorMobileNav } from "./CreatorMobileNav";
import { CreatorHeaderUtilities } from "../dashboard/components/enterprise/CreatorHeaderUtilities";

export function CreatorLayoutClient({
  pendingVerifications,
  userId,
  initialUnreadCount,
  stageName,
  creatorId,
  avatarPath,
  children,
}: {
  pendingVerifications: number;
  userId: string;
  initialUnreadCount: number;
  stageName: string;
  creatorId: string;
  avatarPath: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const title = pathname.startsWith("/creator/catalog/tracks")
    ? "Uploader un morceau"
    : pathname.startsWith("/creator/catalog/releases")
      ? "Albums et morceaux"
      : pathname.startsWith("/creator/catalog")
        ? "Tout mon catalogue"
        : pathname.startsWith("/creator/analytics")
          ? "Mes statistiques"
          : pathname.startsWith("/creator/identity")
            ? "Identité artiste"
            : pathname.startsWith("/creator/verification")
              ? "Vérification"
              : pathname.startsWith("/creator/labels")
                ? "Labels"
                : pathname.startsWith("/creator/rights")
                  ? "Droits et contrats"
                  : pathname.startsWith("/creator/team")
                    ? "Équipe"
                    : "Mon espace artiste";

  return (
    <div className="min-h-dvh bg-noir-profond creator-workspace">
      <header className="creator-header border-b border-bordure">
        <div className="creator-header__inner">
          <div className="creator-header__row">
            <div className="creator-header__copy">
              <div className="creator-breadcrumb">
                <SonafrikLogo variant="wordmark" size="sm" href="/" />
                <span className="creator-breadcrumb__sep" aria-hidden="true">
                  ·
                </span>
                <span className="creator-breadcrumb__section">Espace Artiste</span>
              </div>
              <h1 className="creator-page-title">{title}</h1>
              <p className="creator-page-sub">
                Publiez, développez votre carrière et suivez votre évolution.
              </p>
            </div>
            <CreatorHeaderUtilities
              userId={userId}
              initialUnreadCount={initialUnreadCount}
              stageName={stageName}
              creatorId={creatorId}
              avatarPath={avatarPath}
            />
          </div>
        </div>
      </header>

      <CreatorMobileNav
        activePath={pathname}
        pendingVerifications={pendingVerifications}
      />

      <div className="creator-workspace__frame">
        <aside className="creator-sidebar lg:w-[220px] lg:shrink-0">
          <CreatorNav activePath={pathname} pendingVerifications={pendingVerifications} />
        </aside>
        <div className="min-w-0 flex-1 creator-workspace__main">{children}</div>
      </div>
    </div>
  );
}
