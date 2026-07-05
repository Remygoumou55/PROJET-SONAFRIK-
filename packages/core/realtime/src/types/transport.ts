/** Transport layer — agnostic (Supabase, WebSocket, SSE, polling). */
export type SrtspTransportKind = "supabase" | "websocket" | "sse" | "polling" | "noop";

export type SrtspConnectionState = "online" | "offline" | "reconnecting";

/** Contrat unique transport — le moteur ne dépend d'aucune implémentation concrète. */
export interface SrtspTransportAdapter {
  readonly kind: SrtspTransportKind;
  connect(): Promise<void> | void;
  disconnect(): Promise<void> | void;
  isConnected(): boolean;
  onMessage(handler: (raw: unknown) => void): () => void;
  send?(event: unknown): Promise<void> | void;
}

export interface SrtspTransportOptions {
  reconnectDelayMs?: number;
  maxReconnectAttempts?: number;
  connectTimeoutMs?: number;
}

export interface SrtspTransportLayer {
  readonly adapter: SrtspTransportAdapter;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  reconnect(): Promise<void>;
  getState(): SrtspConnectionState;
  getStats(): SrtspTransportStats;
  onInbound(handler: (raw: unknown) => void): () => void;
}

export interface SrtspTransportStats {
  kind: SrtspTransportKind;
  connected: boolean;
  state: SrtspConnectionState;
  reconnectAttempts: number;
  messagesReceived: number;
  lastConnectedAt: number | null;
}
