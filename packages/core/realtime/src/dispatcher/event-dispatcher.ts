import type { SrtspEvent, SrtspEventDestination } from "../types";
import type { SubscriptionManager } from "../subscription/subscription-manager";

/** Route les événements vers les abonnés par destination. */
export class EventDispatcher {
  constructor(private readonly subscriptions: SubscriptionManager) {}

  /** Retourne les destinations effectives notifiées (pour observabilité). */
  dispatch(
    event: SrtspEvent,
    notify: (destination: SrtspEventDestination, event: SrtspEvent) => void,
  ): SrtspEventDestination[] {
    const notified = new Set<SrtspEventDestination>();
    for (const dest of event.destinations) {
      if (dest === "*") {
        notify("*", event);
        notified.add("*");
      } else {
        notify(dest, event);
        notified.add(dest);
      }
    }
    return [...notified];
  }

  getSubscriptionCount(): number {
    return this.subscriptions.count();
  }
}
