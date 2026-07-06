"use client";

import dynamic from "next/dynamic";
import type { ListenerSidebarData } from "@sonafrik/types";
import type { ListenFeatureFlags } from "@/lib/listen/listen-feature-flags";
import { QualityPreferenceProvider } from "@/lib/qualityPreferenceContext";
import { DevAuthBootstrap } from "@/features/identity/auth/components/DevAuthBootstrap";
import { ListenFeaturesProvider } from "../lib/listenFeaturesContext";
import { PlayerProvider } from "../lib/playerContext";
import { PlayerMuteProvider } from "../lib/playerMuteContext";
import { useAfterFCP } from "../hooks/useAfterFCP";
import { ListenerProgressiveRealtimeShell } from "./ListenerProgressiveRealtimeShell";
import { ListenerSidebarAsync } from "./ListenerSidebarAsync";
import { ListenerSidebarPlaceholder } from "./ListenerSidebarPlaceholder";
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

/**
 * Layer 2–4 — shell client progressif.
 * Player + nav mobile immédiats ; sidebar, player chrome, SRTSP/LDSE après FCP.
 */
export function StreamingLayoutClient({
  children,
  userId,
  initialUnreadCount,
  audioQualityPreference,
  sidebarDataPromise,
  listenFeatures,
}: StreamingLayoutClientProps) {
  const chromeReady = useAfterFCP();

  return (
    <QualityPreferenceProvider value={audioQualityPreference}>
      <ListenFeaturesProvider flags={listenFeatures}>
        <DevAuthBootstrap />
        <PlayerProvider>
          <PlayerMuteProvider>
            <ListenerProgressiveRealtimeShell runtimeReady={chromeReady}>
              <div
                className="has-global-player md:flex md:h-screen md:overflow-hidden"
                style={{ backgroundColor: "var(--color-noir-profond)", minHeight: "100dvh" }}
              >
                {chromeReady ? (
                  <ListenerSidebarAsync
                    userId={userId}
                    initialUnreadCount={initialUnreadCount}
                    sidebarDataPromise={sidebarDataPromise}
                  />
                ) : (
                  <ListenerSidebarPlaceholder />
                )}
                <main
                  className="flex-1 overflow-y-auto md:pb-[88px] md:min-h-screen"
                  style={{
                    paddingBottom: "var(--listener-player-offset)",
                  }}
                >
                  {children}
                </main>
              </div>
              <MobileBottomNav />
              {chromeReady ? <GlobalPlayer /> : null}
              {chromeReady ? <ValidListenToast /> : null}
            </ListenerProgressiveRealtimeShell>
          </PlayerMuteProvider>
        </PlayerProvider>
      </ListenFeaturesProvider>
    </QualityPreferenceProvider>
  );
}
