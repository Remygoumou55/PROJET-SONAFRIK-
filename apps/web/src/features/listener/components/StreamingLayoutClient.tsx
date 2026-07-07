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
                className="enterprise-shell enterprise-shell--listener has-global-player md:flex md:overflow-hidden"
                style={{ minHeight: "100dvh" }}
              >
                {chromeReady ? (
                  <div className="enterprise-sidebar-card">
                    <ListenerSidebarAsync
                      userId={userId}
                      initialUnreadCount={initialUnreadCount}
                      sidebarDataPromise={sidebarDataPromise}
                    />
                  </div>
                ) : (
                  <div className="enterprise-sidebar-card">
                    <ListenerSidebarPlaceholder />
                  </div>
                )}
                <div className="enterprise-main-column flex-1 min-h-0">
                  <main className="enterprise-content-card flex-1 md:pb-[88px]">
                    <div className="enterprise-content-card__inner">{children}</div>
                  </main>
                </div>
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
