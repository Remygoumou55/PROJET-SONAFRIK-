"use client";

import { usePathname } from "next/navigation";
import { MusicHeader } from "@/features/shared/navigation";
import { ADMIN_PAGE_TITLES } from "../lib/admin-nav";
import { useAdminLiveRefresh } from "../hooks/useAdminLiveRefresh";

export interface AdminHeaderUser {
  fullName: string;
  initials: string;
}

interface AdminHeaderProps {
  user: AdminHeaderUser;
  disableLiveRealtime?: boolean;
  menuOpen?: boolean;
  onMenuToggle?: () => void;
}

function resolvePageTitle(pathname: string): string {
  if (ADMIN_PAGE_TITLES[pathname]) return ADMIN_PAGE_TITLES[pathname];
  const match = Object.entries(ADMIN_PAGE_TITLES)
    .filter(([path]) => path !== "/admin")
    .sort((a, b) => b[0].length - a[0].length)
    .find(([path]) => pathname.startsWith(path));
  return match?.[1] ?? "Administration";
}

function liveIndicatorCopy(mode: ReturnType<typeof useAdminLiveRefresh>["mode"], liveTime: string | null): string {
  if (mode === "connecting") return "Connexion…";
  if (mode === "realtime") return liveTime ? `Live · ${liveTime}` : "Live";
  return liveTime ? `Sync · ${liveTime}` : "Sync";
}

function liveIndicatorTitle(mode: ReturnType<typeof useAdminLiveRefresh>["mode"]): string {
  if (mode === "realtime") {
    return "Temps réel Supabase — mise à jour instantanée à chaque inscription ou activité";
  }
  if (mode === "connecting") return "Connexion au flux temps réel…";
  return "Mode secours — actualisation automatique toutes les 60 s";
}

export function AdminHeader({
  user,
  disableLiveRealtime = false,
  menuOpen = false,
  onMenuToggle,
}: AdminHeaderProps) {
  const pathname = usePathname();
  const pageTitle = resolvePageTitle(pathname);
  const { liveTime, mode } = useAdminLiveRefresh({ disableRealtime: disableLiveRealtime });

  return (
    <MusicHeader
      className="admin-header"
      eyebrow="Admin"
      title={pageTitle}
      menuOpen={menuOpen}
      onMenuToggle={onMenuToggle}
      menuControlsId="admin-sidebar-nav"
      right={
        <>
          <div
            className={`admin-live-indicator${mode === "realtime" ? " admin-live-indicator--active" : ""}`}
            title={liveIndicatorTitle(mode)}
          >
            <span className="admin-live-dot" aria-hidden="true" />
            <span suppressHydrationWarning>{liveIndicatorCopy(mode, liveTime)}</span>
          </div>

          <div className="admin-user-badge">
            <span className="admin-user-avatar" aria-hidden="true">
              {user.initials}
            </span>
            <div>
              <p className="admin-user-name">{user.fullName}</p>
              <p className="admin-user-role">Administrateur</p>
            </div>
          </div>
        </>
      }
    />
  );
}
