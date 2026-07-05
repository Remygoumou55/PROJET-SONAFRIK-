import type { SrtspTransportAdapter } from "../types";

export function createNoopTransport(): SrtspTransportAdapter {
  let connected = false;
  const handlers = new Set<(raw: unknown) => void>();
  return {
    kind: "noop",
    connect() {
      connected = true;
    },
    disconnect() {
      connected = false;
    },
    isConnected: () => connected,
    onMessage(handler) {
      handlers.add(handler);
      return () => handlers.delete(handler);
    },
  };
}

export function createPollingTransport(options?: {
  intervalMs?: number;
  onPoll?: () => void;
}): SrtspTransportAdapter & { tick: () => void } {
  const intervalMs = options?.intervalMs ?? 30_000;
  let connected = false;
  let timer: ReturnType<typeof setInterval> | null = null;
  const handlers = new Set<(raw: unknown) => void>();

  const tick = () => {
    options?.onPoll?.();
    for (const h of handlers) h({ type: "poll", at: Date.now() });
  };

  return {
    kind: "polling",
    connect() {
      connected = true;
      timer = setInterval(tick, intervalMs);
    },
    disconnect() {
      connected = false;
      if (timer) clearInterval(timer);
      timer = null;
    },
    isConnected: () => connected,
    onMessage(handler) {
      handlers.add(handler);
      return () => handlers.delete(handler);
    },
    tick,
  };
}

/** Stub Supabase — brancher côté app Phase 2. */
export function createSupabaseTransportStub(): SrtspTransportAdapter {
  return {
    kind: "supabase",
    connect() {},
    disconnect() {},
    isConnected: () => false,
    onMessage: () => () => {},
  };
}

/** Stub WebSocket — préparé, testable, non connecté MVP. */
export function createWebSocketTransportStub(): SrtspTransportAdapter {
  return {
    kind: "websocket",
    connect() {},
    disconnect() {},
    isConnected: () => false,
    onMessage: () => () => {},
  };
}

/** Stub SSE — préparé, testable, non connecté MVP. */
export function createSseTransportStub(): SrtspTransportAdapter {
  return {
    kind: "sse",
    connect() {},
    disconnect() {},
    isConnected: () => false,
    onMessage: () => () => {},
  };
}
