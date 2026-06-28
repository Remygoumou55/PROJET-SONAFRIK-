"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminLiveSnapshot } from "@sonafrik/api/admin";
import { AdminLdseProvider } from "@/features/shared/ldse/admin/AdminLdseProvider";
import { AdminHeader, type AdminHeaderUser } from "./AdminHeader";
import { AdminSidebar } from "./AdminSidebar";

interface Props {
  children: React.ReactNode;
  liveSnapshot: AdminLiveSnapshot;
  adminUser: AdminHeaderUser;
  disableLiveRealtime?: boolean;
}

export function AdminLayoutClient({
  children,
  liveSnapshot,
  adminUser,
  disableLiveRealtime = false,
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
      <div className={`admin-layout${navOpen ? " admin-layout--nav-open" : ""}`}>
          <button
            type="button"
            className="admin-sidebar-backdrop"
            aria-label="Fermer le menu"
            onClick={closeNav}
            tabIndex={navOpen ? 0 : -1}
          />
          <AdminSidebar onNavigate={closeNav} />
          <div className="admin-main">
            <AdminHeader
              user={adminUser}
              disableLiveRealtime={disableLiveRealtime}
              menuOpen={navOpen}
              onMenuToggle={toggleNav}
            />
            <div className="admin-content">{children}</div>
          </div>
        </div>
    </AdminLdseProvider>
  );
}
