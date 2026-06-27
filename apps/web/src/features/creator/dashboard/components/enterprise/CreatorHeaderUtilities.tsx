"use client";

import Link from "next/link";
import { memo } from "react";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { CreatorAssetImage } from "../CreatorAssetImage";

interface CreatorHeaderUtilitiesProps {
  userId: string;
  initialUnreadCount: number;
  stageName: string;
  creatorId: string;
  avatarPath: string | null;
}

function CreatorHeaderUtilitiesView({
  userId,
  initialUnreadCount,
  stageName,
  creatorId,
  avatarPath,
}: CreatorHeaderUtilitiesProps) {
  return (
    <div className="creator-header-utils">
      <NotificationBell initialCount={initialUnreadCount} userId={userId} />
      <Link href="/profile" className="creator-header-utils__profile" aria-label="Mon profil">
        <span className="creator-header-utils__avatar">
          {avatarPath ? (
            <CreatorAssetImage
              creatorId={creatorId}
              path={avatarPath}
              assetKind="cover"
              alt={stageName}
              layout="bounded"
              className="creator-header-utils__avatar-img"
            />
          ) : (
            <span aria-hidden="true">{stageName.slice(0, 1).toUpperCase()}</span>
          )}
        </span>
        <span className="creator-header-utils__meta">
          <span className="creator-header-utils__name">{stageName}</span>
          <span className="creator-header-utils__role">Artiste</span>
        </span>
        <span className="creator-header-utils__chev" aria-hidden="true">
          ▾
        </span>
      </Link>
    </div>
  );
}

export const CreatorHeaderUtilities = memo(CreatorHeaderUtilitiesView);
