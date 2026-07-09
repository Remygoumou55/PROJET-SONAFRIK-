"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MusicHeader } from "@/features/shared/navigation";
import { buttonVariants } from "@sonafrik/ui";
import {
  resolveCreatorPageSubtitle,
  resolveCreatorPageTitle,
} from "../lib/creatorPageMeta";
import { CreatorHeaderUtilities } from "../dashboard/components/enterprise/CreatorHeaderUtilities";

interface CreatorWorkspaceHeaderProps {
  userId: string;
  initialUnreadCount: number;
  pendingVerifications?: number;
}

export function CreatorWorkspaceHeader({
  userId,
  initialUnreadCount,
  pendingVerifications = 0,
}: CreatorWorkspaceHeaderProps) {
  const pathname = usePathname();
  const pageTitle = resolveCreatorPageTitle(pathname);
  const pageSubtitle = resolveCreatorPageSubtitle(pathname);
  const isCatalogManager = pathname === "/creator/catalog/tracks";

  return (
    <MusicHeader
      className="creator-header"
      title={pageTitle}
      subtitle={pageSubtitle ?? undefined}
      right={
        <div className="creator-header__utilities">
          {isCatalogManager ? (
            <Link
              href="/creator/catalog/tracks/new"
              className={buttonVariants({ variant: "primary", size: "sm" })}
            >
              Nouvelle publication
            </Link>
          ) : null}
          <CreatorHeaderUtilities
            userId={userId}
            initialUnreadCount={initialUnreadCount}
            pendingVerifications={pendingVerifications}
          />
        </div>
      }
    />
  );
}
