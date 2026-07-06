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
    <header className="creator-header border-b border-bordure">
      <div className="creator-header__inner">
        <div className="creator-header__row">
          <div className="creator-header__copy">
            <h1 className="creator-page-title">{pageTitle}</h1>
            {pageSubtitle ? <p className="creator-page-sub">{pageSubtitle}</p> : null}
          </div>
          <CreatorHeaderUtilities userId={userId} initialUnreadCount={initialUnreadCount} />
        </div>
      </div>
    </header>
  );
}
