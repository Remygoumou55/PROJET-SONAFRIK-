import { MusicHeader } from "@/features/shared/navigation";
import {
  resolveCreatorPageSubtitle,
  resolveCreatorPageTitle,
} from "../lib/creatorPageMeta";
import { CreatorHeaderUtilities } from "../dashboard/components/enterprise/CreatorHeaderUtilities";

interface CreatorWorkspaceHeaderProps {
  pathname: string;
  userId: string;
  initialUnreadCount: number;
}

export function CreatorWorkspaceHeader({
  pathname,
  userId,
  initialUnreadCount,
}: CreatorWorkspaceHeaderProps) {
  const pageTitle = resolveCreatorPageTitle(pathname);
  const pageSubtitle = resolveCreatorPageSubtitle(pathname);

  return (
    <MusicHeader
      className="creator-header"
      title={pageTitle}
      subtitle={pageSubtitle ?? undefined}
      right={
        <CreatorHeaderUtilities userId={userId} initialUnreadCount={initialUnreadCount} />
      }
    />
  );
}
