"use client";

import { Suspense, use } from "react";
import type { ListenerSidebarData } from "@sonafrik/types";
import { ListenerDesktopSidebar } from "./ListenerDesktopSidebar";

function SidebarSkeleton() {
  return (
    <aside className="listener-sidebar hidden md:flex" aria-hidden="true">
      <div className="px-3 pt-3 pb-6">
        <div className="h-7 w-28 rounded animate-pulse" style={{ backgroundColor: "var(--color-card)" }} />
      </div>
      <div className="flex flex-col gap-2 px-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 rounded-lg animate-pulse" style={{ backgroundColor: "var(--color-card)" }} />
        ))}
      </div>
    </aside>
  );
}

function SidebarWithData({
  sidebarDataPromise,
  userId,
  initialUnreadCount,
}: {
  sidebarDataPromise: Promise<ListenerSidebarData>;
  userId: string;
  initialUnreadCount: number;
}) {
  const sidebarData = use(sidebarDataPromise);
  return (
    <ListenerDesktopSidebar
      userId={userId}
      initialUnreadCount={initialUnreadCount}
      sidebarData={sidebarData}
    />
  );
}

export function ListenerSidebarAsync({
  sidebarDataPromise,
  userId,
  initialUnreadCount,
}: {
  sidebarDataPromise: Promise<ListenerSidebarData>;
  userId: string;
  initialUnreadCount: number;
}) {
  return (
    <Suspense fallback={<SidebarSkeleton />}>
      <SidebarWithData
        sidebarDataPromise={sidebarDataPromise}
        userId={userId}
        initialUnreadCount={initialUnreadCount}
      />
    </Suspense>
  );
}
