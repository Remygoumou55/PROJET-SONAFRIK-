export type StreamingCommand =
  | { readonly type: "OpenSession"; readonly trackId: string; readonly platform?: string }
  | { readonly type: "RecordHeartbeat"; readonly sessionId: string; readonly positionSeconds: number }
  | { readonly type: "CompleteSession"; readonly sessionId: string }
  | { readonly type: "InvalidateSession"; readonly sessionId: string; readonly reason: string };
