export type StreamingQuery =
  | { readonly type: "GetRuntimeStatus" }
  | { readonly type: "GetSessionState"; readonly sessionId: string };
