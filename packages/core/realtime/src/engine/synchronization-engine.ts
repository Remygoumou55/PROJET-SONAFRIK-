import { EventBus } from "../bus/event-bus";
import { EventDispatcher } from "../dispatcher/event-dispatcher";
import { DeduplicationStore } from "../engine/deduplication";
import { EventQueue } from "../engine/event-queue";
import { OfflineBuffer } from "../engine/offline-buffer";
import { EventJournal } from "../observability/event-journal";
import { createMetricsApi, type SrtspMetricsApi } from "../observability/metrics-api";
import { SrtspMonitor } from "../observability/monitor";
import { buildSrtspEventContract } from "../registry/event-contract";
import { getEventRegistry } from "../registry/event-registry";
import { EventGuard } from "../security/event-guard";
import { SubscriptionManager } from "../subscription/subscription-manager";
import { createNoopTransport } from "../transport/adapters";
import { TransportManager } from "../transport/transport-manager";
import type {
  SrtspConnectionState,
  SrtspEvent,
  SrtspEventListener,
  SrtspJournalEntry,
  SrtspMetrics,
  SrtspMonitorSnapshot,
  SrtspPublishInput,
  SrtspTransportAdapter,
} from "../types";
import type { SubscriptionFilter } from "../subscription/subscription-manager";

export interface SynchronizationEngineOptions {
  requireActor?: boolean;
  dedupeTtlMs?: number;
  transport?: SrtspTransportAdapter;
  connectTransportOnInit?: boolean;
}

/** Moteur central SRTSP Enterprise v1.1. */
export class SynchronizationEngine {
  readonly bus = new EventBus();
  readonly registry = getEventRegistry();
  readonly subscriptions = new SubscriptionManager();
  readonly dispatcher = new EventDispatcher(this.subscriptions);
  readonly deduplication: DeduplicationStore;
  readonly queue: EventQueue;
  readonly offline = new OfflineBuffer();
  readonly monitor = new SrtspMonitor();
  readonly journal = new EventJournal();
  readonly guard: EventGuard;
  readonly transport: TransportManager;
  readonly metrics: SrtspMetricsApi;

  private destinationHandlers = new Map<string, Set<SrtspEventListener>>();

  constructor(options: SynchronizationEngineOptions = {}) {
    this.guard = new EventGuard(options.requireActor);
    this.deduplication = new DeduplicationStore(options.dedupeTtlMs);
    this.queue = new EventQueue({
      onRetry: () => this.monitor.trackRetry(),
      onFailure: (event, err) => {
        this.monitor.trackError(err instanceof Error ? err.message : String(err));
        this.journal.error("QUEUE_FAILURE", "Échec traitement événement", {
          eventId: event.id,
          name: event.name,
        });
      },
    });
    this.transport = new TransportManager(options.transport ?? createNoopTransport(), {}, this.journal);
    this.metrics = createMetricsApi(this);

    if (options.connectTransportOnInit) {
      void this.transport.connect().catch(() => {
        /* journalisé par TransportManager */
      });
    }
  }

  setOnline(online: boolean): void {
    this.offline.setOnline(online);
    if (online) {
      const buffered = this.offline.drain();
      for (const event of buffered) this.deliver(event);
    }
  }

  getConnectionState(): SrtspConnectionState {
    return this.transport.getState();
  }

  publish<TPayload extends Record<string, unknown>>(input: SrtspPublishInput<TPayload>): SrtspEvent<TPayload> {
    try {
      this.guard.assertCanPublish(input);
      const validated = this.registry.validatePayload(input.name, input.payload);
      const payload = this.guard.sanitizePayload(validated) as TPayload;
      const event = buildSrtspEventContract(this.registry, input, payload);

      const dedupeKey = event.dedupeKey ?? event.id;
      if (this.deduplication.isDuplicate(dedupeKey, event.timestamp)) {
        this.bus.markDropped();
        this.monitor.trackSent();
        return event;
      }

      this.monitor.trackSent();

      if (!this.offline.isOnline()) {
        this.offline.bufferEvent(event as SrtspEvent);
        return event;
      }

      this.deliver(event as SrtspEvent);
      return event;
    } catch (err) {
      this.bus.markRejected();
      this.monitor.trackRejected();
      const message = err instanceof Error ? err.message : String(err);
      this.monitor.trackError(message);
      this.journal.error("PUBLISH_REJECTED", message, { name: input.name });
      throw err;
    }
  }

  private deliver(event: SrtspEvent): void {
    const start = Date.now();
    this.bus.deliver(event);
    const notified = this.dispatcher.dispatch(event, (dest, ev) => {
      const handlers = this.destinationHandlers.get(dest);
      if (handlers) {
        for (const h of handlers) h(ev);
      }
    });
    this.monitor.trackPropagation(start, notified);
    this.monitor.trackReceived();
  }

  subscribe(filter: SubscriptionFilter, listener: SrtspEventListener): () => void {
    return this.subscriptions.subscribe(this.bus, filter, listener);
  }

  subscribeToDestination(destination: string, listener: SrtspEventListener): () => void {
    let set = this.destinationHandlers.get(destination);
    if (!set) {
      set = new Set();
      this.destinationHandlers.set(destination, set);
    }
    set.add(listener);
    return () => {
      set?.delete(listener);
    };
  }

  async connectTransport(): Promise<void> {
    await this.transport.connect();
  }

  async disconnectTransport(): Promise<void> {
    await this.transport.disconnect();
  }

  async reconnectTransport(): Promise<void> {
    await this.transport.reconnect();
  }

  getSnapshot(): SrtspMonitorSnapshot {
    const tStats = this.transport.getStats();
    return this.monitor.snapshot(
      {
        bus: this.bus.getStats(),
        queue: this.queue.getStats(),
        deduplication: this.deduplication.getStats(),
        offline: this.offline.getStats(),
        transport: {
          kind: tStats.kind,
          connected: tStats.connected,
          state: tStats.state,
          reconnectAttempts: tStats.reconnectAttempts,
        },
      },
      this.journal,
      this.subscriptions.count(),
    );
  }

  getMetrics(): SrtspMetrics {
    const tStats = this.transport.getStats();
    const metrics = this.monitor.toMetrics(
      {
        bus: this.bus.getStats(),
        queue: this.queue.getStats(),
        deduplication: this.deduplication.getStats(),
        offline: this.offline.getStats(),
        transport: {
          kind: tStats.kind,
          connected: tStats.connected,
          state: tStats.state,
          reconnectAttempts: tStats.reconnectAttempts,
        },
      },
      this.journal,
      this.subscriptions.count(),
    );
    metrics.transport.messagesReceived = tStats.messagesReceived;
    return metrics;
  }

  getJournalRecent(limit = 20): SrtspJournalEntry[] {
    return this.journal.getRecent(limit);
  }

  resetForTests(): void {
    this.bus.resetForTests();
    this.subscriptions.resetForTests();
    this.deduplication.resetForTests();
    this.queue.resetForTests();
    this.offline.resetForTests();
    this.monitor.resetForTests();
    this.journal.resetForTests();
    this.transport.resetForTests();
    this.destinationHandlers.clear();
  }
}

let defaultEngine: SynchronizationEngine | null = null;

export function getSynchronizationEngine(): SynchronizationEngine {
  if (!defaultEngine) defaultEngine = new SynchronizationEngine();
  return defaultEngine;
}

export function resetSynchronizationEngineForTests(): void {
  defaultEngine?.resetForTests();
  defaultEngine = null;
}
