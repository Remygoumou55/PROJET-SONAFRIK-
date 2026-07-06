import type { SrtspJournalEntry, SrtspMetrics, SrtspMonitorSnapshot } from "../types";
import type { EventJournal } from "./event-journal";

type LatencySample = { at: number; ms: number };

/** Monitoring SRTSP Enterprise v1.1 — traçabilité complète. */
export class SrtspMonitor {
  private sent = 0;
  private received = 0;
  private rejected = 0;
  private retries = 0;
  private errors = 0;
  private lastError?: string;
  private lastPropagationMs = 0;
  private readonly latencySamples: LatencySample[] = [];
  private readonly maxSamples = 100;
  private lastNotifiedModules: string[] = [];

  trackSent(): void {
    this.sent += 1;
  }

  trackReceived(): void {
    this.received += 1;
  }

  trackRejected(): void {
    this.rejected += 1;
  }

  trackRetry(): void {
    this.retries += 1;
  }

  trackPropagation(startMs: number, notifiedModules: string[]): void {
    const ms = Date.now() - startMs;
    this.lastPropagationMs = ms;
    this.latencySamples.push({ at: Date.now(), ms });
    if (this.latencySamples.length > this.maxSamples) this.latencySamples.shift();
    this.lastNotifiedModules = notifiedModules;
  }

  trackError(message: string): void {
    this.errors += 1;
    this.lastError = message;
  }

  getAvgLatency(): number {
    if (this.latencySamples.length === 0) return 0;
    const sum = this.latencySamples.reduce((a, s) => a + s.ms, 0);
    return Math.round(sum / this.latencySamples.length);
  }

  getMaxLatency(): number {
    if (this.latencySamples.length === 0) return 0;
    return Math.max(...this.latencySamples.map((s) => s.ms));
  }

  snapshot(
    partial: Omit<SrtspMonitorSnapshot, "latency" | "errors" | "subscriptions"> & {
      transport: SrtspMonitorSnapshot["transport"];
    },
    journal: EventJournal,
    activeSubscriptions: number,
  ): SrtspMonitorSnapshot {
    return {
      ...partial,
      bus: { ...partial.bus, eventsRejected: this.rejected },
      queue: { ...partial.queue, retries: this.retries },
      subscriptions: { active: activeSubscriptions },
      latency: {
        lastPropagationMs: this.lastPropagationMs,
        avgPropagationMs: this.getAvgLatency(),
        maxPropagationMs: this.getMaxLatency(),
        samples: this.latencySamples.length,
      },
      errors: { count: this.errors, lastMessage: this.lastError, journalSize: journal.count },
    };
  }

  toMetrics(
    partial: Omit<SrtspMonitorSnapshot, "latency" | "errors" | "subscriptions">,
    journal: EventJournal,
    activeSubscriptions: number,
  ): SrtspMetrics {
    const snap = this.snapshot({ ...partial, transport: partial.transport }, journal, activeSubscriptions);
    return {
      events: {
        published: snap.bus.eventsPublished,
        received: this.received,
        rejected: this.rejected,
        dropped: snap.bus.eventsDropped,
        delivered: snap.bus.eventsDelivered,
      },
      latency: snap.latency,
      retries: this.retries,
      subscriptions: snap.subscriptions,
      transport: {
        kind: snap.transport.kind,
        connected: snap.transport.connected,
        state: snap.transport.state,
        reconnectAttempts: snap.transport.reconnectAttempts,
        messagesReceived: 0,
      },
      errors: { count: this.errors, recent: journal.getRecent(10) },
    };
  }

  resetForTests(): void {
    this.sent = 0;
    this.received = 0;
    this.rejected = 0;
    this.retries = 0;
    this.errors = 0;
    this.lastError = undefined;
    this.lastPropagationMs = 0;
    this.latencySamples.length = 0;
    this.lastNotifiedModules = [];
  }
}

export type { SrtspJournalEntry };
