import type { PlaybackQualityLevel, StreamingPlatform } from "@sonafrik/types";

/** Official Playback Runtime commands — STATE_MACHINE.md §5.1 */
export type PlaybackCommand =
  | { readonly type: "PreparePlayback"; readonly trackId: string; readonly autoPlay?: boolean }
  | { readonly type: "LoadTrack"; readonly trackId: string }
  | {
      readonly type: "LoadSignedUrl";
      readonly trackId: string;
      readonly platform?: StreamingPlatform;
      readonly qualityLevel?: PlaybackQualityLevel;
      readonly deviceId?: string | null;
    }
  | { readonly type: "StartPlayback"; readonly autoPlay?: boolean }
  | { readonly type: "PausePlayback"; readonly positionSeconds: number }
  | { readonly type: "ResumePlayback" }
  | { readonly type: "SeekPlayback"; readonly positionSeconds: number }
  | {
      readonly type: "ChangeQuality";
      readonly qualityLevel: PlaybackQualityLevel;
      readonly positionSeconds: number;
    }
  | { readonly type: "NextTrack"; readonly trackId: string }
  | { readonly type: "PreviousTrack"; readonly trackId: string }
  | { readonly type: "StopPlayback" }
  | { readonly type: "RecoverPlayback"; readonly wasPlaying: boolean }
  | { readonly type: "BufferFilled"; readonly autoPlay?: boolean }
  | { readonly type: "BufferEmpty" }
  | { readonly type: "BufferTimeout" }
  | { readonly type: "ConnectionLost" }
  | { readonly type: "ConnectionRecovered"; readonly wasPlaying: boolean }
  | { readonly type: "ReconnectTimeout" }
  | { readonly type: "TrackEnded"; readonly positionSeconds: number; readonly totalDurationSeconds: number }
  | { readonly type: "AudioError"; readonly reason: string }
  | { readonly type: "SeekCompleted"; readonly positionSeconds: number }
  | { readonly type: "SeekFailed"; readonly reason: string }
  | { readonly type: "ReconcileToIdle" };

export type PlaybackCommandType = PlaybackCommand["type"];
