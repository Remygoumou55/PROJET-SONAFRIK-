import type { LdseEvent, LdseEventPayload } from "./types";

type LdseListener = (event: LdseEvent) => void;

const listeners = new Map<string, Set<LdseListener>>();
const wildcardListeners = new Set<LdseListener>();

let subscriptions = 0;
let eventsPublished = 0;
const eventsByType: Record<string, number> = {};

function trackEvent(type: string): void {
  eventsPublished += 1;
  eventsByType[type] = (eventsByType[type] ?? 0) + 1;
}

/** Bus d'événements interne LDSE — singleton process-wide (client). */
export const ldseEventBus = {
  publish(type: string, payload?: LdseEventPayload): LdseEvent {
    const event: LdseEvent = { type, payload, at: Date.now() };
    trackEvent(type);

    const typeListeners = listeners.get(type);
    if (typeListeners) {
      for (const listener of typeListeners) listener(event);
    }
    for (const listener of wildcardListeners) listener(event);

    return event;
  },

  subscribe(type: string, listener: LdseListener): () => void {
    let set = listeners.get(type);
    if (!set) {
      set = new Set();
      listeners.set(type, set);
    }
    set.add(listener);
    subscriptions += 1;

    return () => {
      set?.delete(listener);
      subscriptions = Math.max(0, subscriptions - 1);
    };
  },

  subscribeAll(listener: LdseListener): () => void {
    wildcardListeners.add(listener);
    subscriptions += 1;
    return () => {
      wildcardListeners.delete(listener);
      subscriptions = Math.max(0, subscriptions - 1);
    };
  },

  getStats() {
    return { subscriptions, eventsPublished, eventsByType: { ...eventsByType } };
  },

  /** Tests / hot reload dev uniquement */
  _resetForTests(): void {
    listeners.clear();
    wildcardListeners.clear();
    subscriptions = 0;
    eventsPublished = 0;
    for (const key of Object.keys(eventsByType)) delete eventsByType[key];
  },
};
