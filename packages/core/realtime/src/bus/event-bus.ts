import type { SrtspBusStats, SrtspEvent, SrtspEventListener } from "../types";

/** Event Bus — publication / distribution synchrone in-process. */
export class EventBus {
  private readonly listeners = new Map<string, Set<SrtspEventListener>>();
  private readonly wildcardListeners = new Set<SrtspEventListener>();
  private subscriptions = 0;
  private eventsPublished = 0;
  private eventsDelivered = 0;
  private eventsDropped = 0;
  private eventsRejected = 0;
  private readonly eventsByName: Record<string, number> = {};

  deliver(event: SrtspEvent): number {
    this.eventsPublished += 1;
    this.eventsByName[event.name] = (this.eventsByName[event.name] ?? 0) + 1;

    let delivered = 0;
    const typeListeners = this.listeners.get(event.name);
    if (typeListeners) {
      for (const listener of typeListeners) {
        listener(event);
        delivered += 1;
      }
    }
    for (const listener of this.wildcardListeners) {
      listener(event);
      delivered += 1;
    }
    this.eventsDelivered += delivered;
    return delivered;
  }

  markDropped(): void {
    this.eventsDropped += 1;
  }

  markRejected(): void {
    this.eventsRejected += 1;
  }

  subscribe(name: string, listener: SrtspEventListener): () => void {
    let set = this.listeners.get(name);
    if (!set) {
      set = new Set();
      this.listeners.set(name, set);
    }
    set.add(listener);
    this.subscriptions += 1;

    return () => {
      set?.delete(listener);
      this.subscriptions = Math.max(0, this.subscriptions - 1);
    };
  }

  subscribeAll(listener: SrtspEventListener): () => void {
    this.wildcardListeners.add(listener);
    this.subscriptions += 1;
    return () => {
      this.wildcardListeners.delete(listener);
      this.subscriptions = Math.max(0, this.subscriptions - 1);
    };
  }

  getStats(): SrtspBusStats {
    return {
      subscriptions: this.subscriptions,
      eventsPublished: this.eventsPublished,
      eventsDelivered: this.eventsDelivered,
      eventsDropped: this.eventsDropped,
      eventsRejected: this.eventsRejected,
      eventsByName: { ...this.eventsByName },
    };
  }

  resetForTests(): void {
    this.listeners.clear();
    this.wildcardListeners.clear();
    this.subscriptions = 0;
    this.eventsPublished = 0;
    this.eventsDelivered = 0;
    this.eventsDropped = 0;
    this.eventsRejected = 0;
    for (const key of Object.keys(this.eventsByName)) delete this.eventsByName[key];
  }
}
