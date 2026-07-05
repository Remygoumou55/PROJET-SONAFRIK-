import type { SrtspEvent, SrtspEventDestination, SrtspEventListener } from "../types";

export type SubscriptionFilter = {
  eventName?: string | string[];
  destination?: SrtspEventDestination;
  source?: string;
};

type ManagedSubscription = {
  id: string;
  filter: SubscriptionFilter;
  listener: SrtspEventListener;
  unsubscribe: () => void;
};

let subCounter = 0;

/** Gestion des abonnements module — filtrage destination / nom. */
export class SubscriptionManager {
  private readonly subscriptions = new Map<string, ManagedSubscription>();

  subscribe(
    bus: { subscribe: (name: string, l: SrtspEventListener) => () => void; subscribeAll: (l: SrtspEventListener) => () => void },
    filter: SubscriptionFilter,
    listener: SrtspEventListener,
  ): () => void {
    const id = `sub_${++subCounter}`;
    const wrapped: SrtspEventListener = (event) => {
      if (!this.matches(filter, event)) return;
      listener(event);
    };

    const names = filter.eventName
      ? Array.isArray(filter.eventName)
        ? filter.eventName
        : [filter.eventName]
      : null;

    const unsubs: (() => void)[] = [];
    if (names) {
      for (const name of names) unsubs.push(bus.subscribe(name, wrapped));
    } else {
      unsubs.push(bus.subscribeAll(wrapped));
    }

    const unsubscribe = () => {
      for (const u of unsubs) u();
      this.subscriptions.delete(id);
    };

    this.subscriptions.set(id, { id, filter, listener, unsubscribe });
    return unsubscribe;
  }

  matches(filter: SubscriptionFilter, event: SrtspEvent): boolean {
    if (filter.source && event.source !== filter.source) return false;
    if (filter.destination) {
      if (!event.destinations.includes("*") && !event.destinations.includes(filter.destination)) {
        return false;
      }
    }
    if (filter.eventName) {
      const names = Array.isArray(filter.eventName) ? filter.eventName : [filter.eventName];
      if (!names.includes(event.name)) return false;
    }
    return true;
  }

  count(): number {
    return this.subscriptions.size;
  }

  resetForTests(): void {
    for (const sub of this.subscriptions.values()) sub.unsubscribe();
    this.subscriptions.clear();
    subCounter = 0;
  }
}
