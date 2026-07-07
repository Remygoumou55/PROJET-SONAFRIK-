"use client";

import { Suspense, use } from "react";
import type { ListenerSidebarData } from "@sonafrik/types";
import { useListenSidebarLdse } from "@/features/shared/ldse/listener/useListenSidebarLdse";
import { ListenerDesktopSidebar } from "./ListenerDesktopSidebar";

function SidebarSkeleton() {
  return (
    <aside className="music-sidebar music-sidebar--listener" aria-hidden="true">
      <div className="music-sidebar__pattern" />
      <div className="music-sidebar__body">
        <div className="music-sidebar__brand">
          <div className="h-5 w-28 rounded animate-pulse admin-skeleton-block" />
          <div className="h-2 w-24 rounded animate-pulse admin-skeleton-block mt-2" />
        </div>
        <div className="music-nav__group" style={{ padding: "0.5rem" }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 rounded-lg animate-pulse admin-skeleton-block mb-1" />
          ))}
        </div>
      </div>
    </aside>
  );
}

function SidebarWithData({
  userId,
  sidebarDataPromise,
}: {
  userId: string;
  sidebarDataPromise: Promise<ListenerSidebarData>;
}) {
  const initial = use(sidebarDataPromise);
  const sidebarData = useListenSidebarLdse(userId, initial);
  return <ListenerDesktopSidebar sidebarData={sidebarData} />;
}

export function ListenerSidebarAsync({
  sidebarDataPromise,
  userId,
}: {
  sidebarDataPromise: Promise<ListenerSidebarData>;
  userId: string;
  initialUnreadCount: number;
}) {
  return (
    <Suspense fallback={<SidebarSkeleton />}>
      <SidebarWithData userId={userId} sidebarDataPromise={sidebarDataPromise} />
    </Suspense>
  );
}
