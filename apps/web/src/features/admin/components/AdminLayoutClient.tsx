"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminLiveSnapshot } from "@sonafrik/api/admin";
import type { AdminNavFeatureFlags } from "../lib/admin-nav";
import { AdminLdseProvider } from "@/features/shared/ldse/admin/AdminLdseProvider";
import { AdminHeader, type AdminHeaderUser } from "./AdminHeader";
import { AdminSidebar } from "./AdminSidebar";

interface Props {
  children: React.ReactNode;
  liveSnapshot: AdminLiveSnapshot;
  adminUser: AdminHeaderUser;
  disableLiveRealtime?: boolean;
  navFeatureFlags?: AdminNavFeatureFlags;
}

export function AdminLayoutClient({
  children,
  liveSnapshot,
  adminUser,
  disableLiveRealtime = false,
  navFeatureFlags,
}: Props) {
  const [navOpen, setNavOpen] = useState(false);

  const closeNav = useCallback(() => setNavOpen(false), []);
  const toggleNav = useCallback(() => setNavOpen((open) => !open), []);

  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeNav();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [navOpen, closeNav]);

  useEffect(() => {
    document.body.style.overflow = navOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [navOpen]);

  return (
    <AdminLdseProvider initialSnapshot={liveSnapshot}>
      <div className={`admin-layout enterprise-shell${navOpen ? " admin-layout--nav-open" : ""}`}>
          <button
            type="button"
            className="admin-sidebar-backdrop"
            aria-label="Fermer le menu"
            onClick={closeNav}
            tabIndex={navOpen ? 0 : -1}
          />
          <div className="enterprise-sidebar-card">
            <AdminSidebar onNavigate={closeNav} featureFlags={navFeatureFlags} />
          </div>
          <div className="enterprise-main-column admin-main">
            <AdminHeader
              user={adminUser}
              disableLiveRealtime={disableLiveRealtime}
              menuOpen={navOpen}
              onMenuToggle={toggleNav}
            />
            <div className="enterprise-content-card admin-content">
              <div className="enterprise-content-card__inner">{children}</div>
            </div>
          </div>
        </div>
    </AdminLdseProvider>
  );
}
