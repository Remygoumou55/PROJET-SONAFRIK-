"use client";

import dynamic from "next/dynamic";
import type { ListenerSidebarData } from "@sonafrik/types";
import { QualityPreferenceProvider } from "@/lib/qualityPreferenceContext";
import { DevAuthBootstrap } from "@/features/identity/auth/components/DevAuthBootstrap";
import { PlayerProvider } from "../lib/playerContext";
import { ListenerDesktopSidebar } from "./ListenerDesktopSidebar";
import { MobileBottomNav } from "./ListenerMobileBottomNav";

const WebPlayer = dynamic(
  () => import("./WebPlayer").then((m) => ({ default: m.WebPlayer })),
  { ssr: false },
);

interface StreamingLayoutClientProps {
  children: React.ReactNode;
  userId: string;
  initialUnreadCount: number;
  audioQualityPreference: import("@sonafrik/types").AudioQualityPreference;
  sidebarData: ListenerSidebarData;
}

export function StreamingLayoutClient({
  children,
  userId,
  initialUnreadCount,
  audioQualityPreference,
  sidebarData,
}: StreamingLayoutClientProps) {
  return (
    <QualityPreferenceProvider value={audioQualityPreference}>
      <DevAuthBootstrap />
      <PlayerProvider>
        <div style={{ backgroundColor: "var(--color-noir-profond)", minHeight: "100dvh" }}>
          <div className="md:flex md:h-screen md:overflow-hidden">
            <ListenerDesktopSidebar
              userId={userId}
              initialUnreadCount={initialUnreadCount}
              sidebarData={sidebarData}
            />
            <main className="flex-1 overflow-y-auto pb-40 md:pb-24 md:min-h-screen">
              {children}
            </main>
          </div>
          <MobileBottomNav userId={userId} initialUnreadCount={initialUnreadCount} />
        </div>
        <WebPlayer />
      </PlayerProvider>
    </QualityPreferenceProvider>
  );
}
