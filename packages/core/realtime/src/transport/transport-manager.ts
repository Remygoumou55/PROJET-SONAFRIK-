import type { SrtspTransportAdapter, SrtspTransportLayer, SrtspTransportOptions, SrtspTransportStats } from "../types";
import type { EventJournal } from "../observability/event-journal";

/** Gestionnaire transport — reconnexion, timeout, inbound normalisé. */
export class TransportManager implements SrtspTransportLayer {
  readonly adapter: SrtspTransportAdapter;
  private state: SrtspTransportStats["state"] = "offline";
  private reconnectAttempts = 0;
  private messagesReceived = 0;
  private lastConnectedAt: number | null = null;
  private unsubMessage: (() => void) | null = null;
  private readonly inboundHandlers = new Set<(raw: unknown) => void>();

  constructor(
    adapter: SrtspTransportAdapter,
    private readonly options: SrtspTransportOptions = {},
    private readonly journal?: EventJournal,
  ) {
    this.adapter = adapter;
  }

  async connect(): Promise<void> {
    const timeoutMs = this.options.connectTimeoutMs ?? 10_000;
    try {
      await Promise.race([
        Promise.resolve(this.adapter.connect()),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("SRTSP transport connect timeout")), timeoutMs);
        }),
      ]);
      this.state = "online";
      this.lastConnectedAt = Date.now();
      this.reconnectAttempts = 0;
      this.wireInbound();
    } catch (err) {
      this.state = "offline";
      this.journal?.error("TRANSPORT_CONNECT", err instanceof Error ? err.message : String(err));
      throw err;
    }
  }

  async disconnect(): Promise<void> {
    this.unsubMessage?.();
    this.unsubMessage = null;
    await Promise.resolve(this.adapter.disconnect());
    this.state = "offline";
  }

  async reconnect(): Promise<void> {
    const max = this.options.maxReconnectAttempts ?? 5;
    if (this.reconnectAttempts >= max) {
      this.journal?.error("TRANSPORT_RECONNECT_MAX", `Max attempts (${max}) reached`);
      return;
    }
    this.state = "reconnecting";
    this.reconnectAttempts += 1;
    const delay = (this.options.reconnectDelayMs ?? 1_000) * this.reconnectAttempts;
    await new Promise((r) => setTimeout(r, delay));
    try {
      await this.disconnect();
      await this.connect();
    } catch {
      this.journal?.warn("TRANSPORT_RECONNECT_FAIL", `Attempt ${this.reconnectAttempts}/${max}`);
    }
  }

  getState(): SrtspTransportStats["state"] {
    return this.state;
  }

  getStats(): SrtspTransportStats {
    return {
      kind: this.adapter.kind,
      connected: this.adapter.isConnected(),
      state: this.state,
      reconnectAttempts: this.reconnectAttempts,
      messagesReceived: this.messagesReceived,
      lastConnectedAt: this.lastConnectedAt,
    };
  }

  onInbound(handler: (raw: unknown) => void): () => void {
    this.inboundHandlers.add(handler);
    return () => this.inboundHandlers.delete(handler);
  }

  private wireInbound(): void {
    this.unsubMessage?.();
    this.unsubMessage = this.adapter.onMessage((raw) => {
      this.messagesReceived += 1;
      for (const h of this.inboundHandlers) h(raw);
    });
  }

  resetForTests(): void {
    this.unsubMessage?.();
    this.unsubMessage = null;
    this.state = "offline";
    this.reconnectAttempts = 0;
    this.messagesReceived = 0;
    this.lastConnectedAt = null;
    this.inboundHandlers.clear();
  }
}
