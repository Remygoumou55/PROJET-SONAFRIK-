export const VALID_LISTEN_EVENT = "sonafrik:valid-listen";

export interface ValidListenDetail {
  trackId: string;
}

export function dispatchValidListen(trackId: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<ValidListenDetail>(VALID_LISTEN_EVENT, {
      detail: { trackId },
    }),
  );
}
