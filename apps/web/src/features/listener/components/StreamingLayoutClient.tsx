"use client";

import dynamic from "next/dynamic";
import type { ListenerSidebarData } from "@sonafrik/types";
import { QualityPreferenceProvider } from "@/lib/qualityPreferenceContext";
import { DevAuthBootstrap } from "@/features/identity/auth/components/DevAuthBootstrap";
import { PlayerProvider } from "../lib/playerContext";
import { ListenerSidebarAsync } from "./ListenerSidebarAsync";
import { MobileBottomNav } from "./ListenerMobileBottomNav";

const GlobalPlayer = dynamic(
  () => import("./GlobalPlayer").then((m) => ({ default: m.GlobalPlayer })),
  { ssr: false },
);

interface StreamingLayoutClientProps {
  children: React.ReactNode;
  userId: string;
  initialUnreadCount: number;
  audioQualityPreference: import("@sonafrik/types").AudioQualityPreference;
  sidebarDataPromise: Promise<ListenerSidebarData>;
}

export function StreamingLayoutClient({
  children,
  userId,
  initialUnreadCount,
  audioQualityPreference,
  sidebarDataPromise,
}: StreamingLayoutClientProps) {
  return (
    <QualityPreferenceProvider value={audioQualityPreference}>
      <DevAuthBootstrap />
      <PlayerProvider>
        <div
          className="has-global-player md:flex md:h-screen md:overflow-hidden"
          style={{ backgroundColor: "var(--color-noir-profond)", minHeight: "100dvh" }}
        >
          <ListenerSidebarAsync
            userId={userId}
            initialUnreadCount={initialUnreadCount}
            sidebarDataPromise={sidebarDataPromise}
          />
          <main className="flex-1 overflow-y-auto pb-40 md:pb-[88px] md:min-h-screen">
            {children}
          </main>
        </div>
        <MobileBottomNav userId={userId} initialUnreadCount={initialUnreadCount} />
        <GlobalPlayer />
      </PlayerProvider>
    </QualityPreferenceProvider>
  );
}
