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
import { normalizeSupabaseInbound } from "../transport/inbound-normalizer";
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
  /** Journalise chaque étape du pipeline (diagnostic E2E — désactivé par défaut). */
  enablePipelineTrace?: boolean;
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
  private transportInboundBound = false;
  private readonly pipelineTraceEnabled: boolean;

  constructor(options: SynchronizationEngineOptions = {}) {
    this.pipelineTraceEnabled = options.enablePipelineTrace === true;
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
    this.bindTransportInbound();

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

  /** Ingestion transport → bus (sans contourner EventGuard / Registry). */
  ingestFromTransport(input: SrtspPublishInput): SrtspEvent | null {
    try {
      return this.publish(input);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.journal.warn("TRANSPORT_INGEST_SKIP", message, { name: input.name });
      return null;
    }
  }

  private bindTransportInbound(): void {
    if (this.transportInboundBound) return;
    this.transportInboundBound = true;
    this.transport.onInbound((raw) => {
      this.tracePipeline("transport.inbound", { kind: this.transport.adapter.kind });
      const input = normalizeSupabaseInbound(raw);
      if (!input) {
        this.journal.warn("TRANSPORT_INBOUND_IGNORED", "Message inbound non mappable", {
          transport: this.transport.adapter.kind,
        });
        this.tracePipeline("normalizer.skipped");
        return;
      }
      this.tracePipeline("normalizer.mapped", { name: input.name });
      this.ingestFromTransport(input);
    });
  }

  private tracePipeline(stage: string, context?: Record<string, unknown>): void {
    if (!this.pipelineTraceEnabled) return;
    this.journal.info("PIPELINE_TRACE", stage, context);
  }

  publish<TPayload extends Record<string, unknown>>(input: SrtspPublishInput<TPayload>): SrtspEvent<TPayload> {
    try {
      this.guard.assertCanPublish(input);
      this.tracePipeline("guard.validated", { name: input.name });
      const validated = this.registry.validatePayload(input.name, input.payload);
      this.tracePipeline("registry.validated", { name: input.name });
      const payload = this.guard.sanitizePayload(validated) as TPayload;
      const event = buildSrtspEventContract(this.registry, input, payload);
      this.tracePipeline("registry.contract", { eventId: event.id, name: event.name });

      const dedupeKey = event.dedupeKey ?? event.id;
      if (this.deduplication.isDuplicate(dedupeKey, event.timestamp)) {
        this.bus.markDropped();
        this.monitor.trackSent();
        this.tracePipeline("dedupe.dropped", { dedupeKey });
        return event;
      }
      this.tracePipeline("dedupe.accepted", { dedupeKey });

      this.monitor.trackSent();

      if (!this.offline.isOnline()) {
        this.offline.bufferEvent(event as SrtspEvent);
        this.tracePipeline("offline.buffered", { eventId: event.id });
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
    this.tracePipeline("bus.deliver.start", { name: event.name, eventId: event.id });
    const listenerCount = this.bus.deliver(event);
    this.tracePipeline("bus.delivered", { name: event.name, listenerCount });
    const notified = this.dispatcher.dispatch(event, (dest, ev) => {
      const handlers = this.destinationHandlers.get(dest);
      if (handlers) {
        for (const h of handlers) h(ev);
      }
    });
    this.tracePipeline("dispatcher.notified", { destinations: notified });
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
    this.bindTransportInbound();
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
    this.transportInboundBound = false;
    this.bindTransportInbound();
  }
}

let defaultEngine: SynchronizationEngine | null = null;

export function getSynchronizationEngine(
  options?: SynchronizationEngineOptions,
): SynchronizationEngine {
  if (!defaultEngine) {
    defaultEngine = new SynchronizationEngine(options);
  }
  return defaultEngine;
}

export function resetSynchronizationEngineForTests(): void {
  defaultEngine?.resetForTests();
  defaultEngine = null;
}
