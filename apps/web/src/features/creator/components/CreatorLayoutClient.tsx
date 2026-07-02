"use client";

import { usePathname } from "next/navigation";
import type { ArtistTier } from "@sonafrik/types";
import { CreatorSidebar } from "./CreatorSidebar";
import { CreatorMobileNav } from "./CreatorMobileNav";
import { CreatorHeaderUtilities } from "../dashboard/components/enterprise/CreatorHeaderUtilities";

export function CreatorLayoutClient({
  pendingVerifications,
  userId,
  initialUnreadCount,
  stageName: _stageName,
  creatorId: _creatorId,
  avatarPath: _avatarPath,
  tier: _tier,
  children,
}: {
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

  return (
    <div className="min-h-dvh bg-noir-profond creator-workspace">
      <header className="creator-header border-b border-bordure">
        <div className="creator-header__inner">
          <div className="creator-header__row">
            <div className="creator-header__copy">
              <h1 className="creator-page-title">
                {pathname.startsWith("/creator/catalog/tracks")
                  ? "Publier"
                  : pathname.startsWith("/creator/catalog/releases")
                    ? "Albums et morceaux"
                    : pathname.startsWith("/creator/catalog")
                      ? "Mon catalogue"
                      : pathname.startsWith("/creator/analytics")
                        ? "Statistiques"
                        : pathname.startsWith("/creator/identity")
                          ? "Mon profil"
                          : pathname === "/creator"
                            ? "Vue d'ensemble"
                            : "Espace Artiste"}
              </h1>
              {pathname.startsWith("/creator/catalog/tracks") && (
                <p className="creator-page-sub">
                  Partagez votre musique avec le monde entier 🚀
                </p>
              )}
            </div>
            <CreatorHeaderUtilities
              userId={userId}
              initialUnreadCount={initialUnreadCount}
            />
          </div>
        </div>
      </header>

      <CreatorMobileNav
        activePath={pathname}
        pendingVerifications={pendingVerifications}
      />

      <div className="creator-workspace__frame">
        <CreatorSidebar />
        <div className="min-w-0 flex-1 creator-workspace__main">{children}</div>
      </div>
    </div>
  );
}
