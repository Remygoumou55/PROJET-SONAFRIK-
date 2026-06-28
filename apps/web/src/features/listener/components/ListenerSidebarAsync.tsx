"use client";

import { Suspense, use } from "react";
import type { ListenerSidebarData } from "@sonafrik/types";
import { ListenerDesktopSidebar } from "./ListenerDesktopSidebar";

function SidebarSkeleton() {
  return (
    <aside className="listener-sidebar hidden md:flex" aria-hidden="true">
      <div className="ls-logo">
        <div className="h-5 w-28 rounded animate-pulse ls-skeleton" />
        <div className="h-2 w-24 rounded animate-pulse ls-skeleton mt-2" />
      </div>
      <div className="ls-nav">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-10 rounded-lg animate-pulse ls-skeleton" />
        ))}
      </div>
    </aside>
  );
}

function SidebarWithData({
  sidebarDataPromise,
}: {
  sidebarDataPromise: Promise<ListenerSidebarData>;
}) {
  const sidebarData = use(sidebarDataPromise);
  return <ListenerDesktopSidebar sidebarData={sidebarData} />;
}

export function ListenerSidebarAsync({
  sidebarDataPromise,
}: {
  sidebarDataPromise: Promise<ListenerSidebarData>;
  userId: string;
  initialUnreadCount: number;
}) {
  return (
    <Suspense fallback={<SidebarSkeleton />}>
      <SidebarWithData sidebarDataPromise={sidebarDataPromise} />
    </Suspense>
  );
}
