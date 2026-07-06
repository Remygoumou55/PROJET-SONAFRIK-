import Link from "next/link";
import { Suspense } from "react";
import { getInitials } from "@/lib/utils";
import { HeaderFilters } from "./HeaderFilters";
import { ListenSearchBarSlot } from "./ListenSearchBarSlot";

interface ListenStreamingHeaderProps {
  fullName: string | null;
  unreadNotifications: number;
}

function FiltersSkeleton() {
  return <div className="header-filters-skeleton" aria-hidden="true" />;
}

export function ListenStreamingHeader({ fullName, unreadNotifications }: ListenStreamingHeaderProps) {
  const firstName = fullName?.split(" ")[0] ?? "là";

  return (
    <header className="streaming-header">
      <div className="header-logo-mobile" aria-hidden="true">
        SON<span className="header-logo-mobile-accent">A</span>FRIK
      </div>

      <div className="header-center">
        <div className="header-search-slot">
          <ListenSearchBarSlot />
        </div>
        <Suspense fallback={<FiltersSkeleton />}>
          <HeaderFilters />
        </Suspense>
      </div>

      <div className="header-right">
        <Link
          href="/notifications"
          className="relative"
          aria-label={`Notifications${unreadNotifications > 0 ? ` (${unreadNotifications} non lues)` : ""}`}
        >
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="var(--color-texte-secondaire)" strokeWidth="1.8">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {unreadNotifications > 0 ? (
            <span className="header-notif-badge">{unreadNotifications}</span>
          ) : null}
        </Link>
        <Link href="/profile" aria-label={`Profil de ${firstName}`}>
          <div className="header-avatar">{getInitials(firstName)}</div>
        </Link>
      </div>
    </header>
  );
}
