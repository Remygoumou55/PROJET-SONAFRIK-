"use client";

import { usePathname } from "next/navigation";
import type { ArtistTier } from "@sonafrik/types";
import { CreatorSidebar } from "./CreatorSidebar";
import { CreatorMobileNav } from "./CreatorMobileNav";
import { CreatorHeaderUtilities } from "../dashboard/components/enterprise/CreatorHeaderUtilities";
import type { CreatorNavEntry } from "../lib/creatorNavConfig";

function resolveCreatorPageTitle(pathname: string): string {
  if (pathname === "/creator/catalog/tracks") return "Mes publications";
  if (pathname.startsWith("/creator/catalog/tracks/new")) return "Publier";
  if (/^\/creator\/catalog\/tracks\/[^/]+\/edit/.test(pathname)) return "Modifier la publication";
  if (pathname.startsWith("/creator/catalog/releases")) return "Albums et morceaux";
  if (pathname.startsWith("/creator/catalog")) return "Mon catalogue";
  if (pathname.startsWith("/creator/analytics")) return "Statistiques";
  if (pathname.startsWith("/creator/identity")) return "Mon profil";
  if (pathname === "/creator") return "Vue d'ensemble";
  return "Espace Artiste";
}

function resolveCreatorPageSubtitle(pathname: string): string | null {
  if (pathname === "/creator/catalog/tracks") {
    return "Gérez vos publications, suivez leur validation et leur diffusion.";
  }
  if (pathname.startsWith("/creator/catalog/tracks/new")) {
    return "Partagez votre musique avec le monde entier 🚀";
  }
  return null;
}

export function CreatorLayoutClient({
  navEntries,
  pendingVerifications: _pendingVerifications,
  userId,
  initialUnreadCount,
  stageName: _stageName,
  creatorId: _creatorId,
  avatarPath: _avatarPath,
  tier: _tier,
  children,
}: {
  navEntries: CreatorNavEntry[];
  pendingVerifications: number;
  userId: string;
  initialUnreadCount: number;
  stageName: string;
  creatorId: string;
  avatarPath: string | null;
  tier: ArtistTier;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const pageTitle = resolveCreatorPageTitle(pathname);
  const pageSubtitle = resolveCreatorPageSubtitle(pathname);

  return (
    <div className="min-h-dvh bg-noir-profond creator-workspace">
      <CreatorSidebar navEntries={navEntries} />

      <div className="creator-workspace__body">
        <header className="creator-header border-b border-bordure">
          <div className="creator-header__inner">
            <div className="creator-header__row">
              <div className="creator-header__copy">
                <h1 className="creator-page-title">{pageTitle}</h1>
                {pageSubtitle ? (
                  <p className="creator-page-sub">{pageSubtitle}</p>
                ) : null}
              </div>
              <CreatorHeaderUtilities
                userId={userId}
                initialUnreadCount={initialUnreadCount}
              />
            </div>
          </div>
        </header>

        <CreatorMobileNav activePath={pathname} navEntries={navEntries} />

        <div className="creator-workspace__main">
          <div className="creator-workspace__frame">{children}</div>
        </div>
      </div>
    </div>
  );
}
