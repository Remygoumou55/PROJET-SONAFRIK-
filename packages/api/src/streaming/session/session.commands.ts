import type { StreamingPlatform } from "@sonafrik/types";

/** Official Session Engine commands — STATE_MACHINE.md §5.2 */
export type SessionCommand =
  | { readonly type: "AuthenticateSession" }
  | {
      readonly type: "CreateSession";
      readonly trackId: string;
      readonly platform?: StreamingPlatform;
      readonly qualityKbps?: number | null;
      readonly deviceId?: string | null;
      readonly totalDurationSeconds?: number;
    }
  | { readonly type: "ActivateSession"; readonly sessionId: string }
  | { readonly type: "HeartbeatSession"; readonly sessionId: string; readonly positionSeconds: number }
  | { readonly type: "SuspendSession"; readonly sessionId: string }
  | { readonly type: "ResumeSession"; readonly sessionId: string }
  | { readonly type: "ExpireSession"; readonly sessionId: string }
  | {
      readonly type: "CloseSession";
      readonly sessionId: string;
      readonly positionSeconds: number;
      readonly totalDurationSeconds: number;
    }
  | { readonly type: "RecoverSession"; readonly sessionId: string }
  | {
      readonly type: "CompleteSession";
      readonly sessionId: string;
      readonly positionSeconds: number;
      readonly totalDurationSeconds: number;
    }
  | { readonly type: "InvalidateSession"; readonly sessionId: string; readonly reason: string };

export type SessionCommandType = SessionCommand["type"];
