"use client";

import dynamic from "next/dynamic";
import type { ListenerSidebarData } from "@sonafrik/types";
import type { ListenFeatureFlags } from "@/lib/listen/listen-feature-flags";
import { QualityPreferenceProvider } from "@/lib/qualityPreferenceContext";
import { DevAuthBootstrap } from "@/features/identity/auth/components/DevAuthBootstrap";
import { ListenFeaturesProvider } from "../lib/listenFeaturesContext";
import { PlayerProvider } from "../lib/playerContext";
import { PlayerMuteProvider } from "../lib/playerMuteContext";
import { ListenerSidebarAsync } from "./ListenerSidebarAsync";
import { MobileBottomNav } from "./ListenerMobileBottomNav";
import { ValidListenToast } from "./ValidListenToast";

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
  listenFeatures: ListenFeatureFlags;
}

export function StreamingLayoutClient({
  children,
  userId,
  initialUnreadCount,
  audioQualityPreference,
  sidebarDataPromise,
  listenFeatures,
}: StreamingLayoutClientProps) {
  return (
    <QualityPreferenceProvider value={audioQualityPreference}>
      <ListenFeaturesProvider flags={listenFeatures}>
        <DevAuthBootstrap />
        <PlayerProvider>
        <PlayerMuteProvider>
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
        <MobileBottomNav />
        <GlobalPlayer />
        <ValidListenToast />
        </PlayerMuteProvider>
        </PlayerProvider>
      </ListenFeaturesProvider>
    </QualityPreferenceProvider>
  );
}
