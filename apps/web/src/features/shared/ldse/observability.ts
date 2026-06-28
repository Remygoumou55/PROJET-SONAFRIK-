import { ldseCache } from "./cache";
import { ldseEventBus } from "./event-bus";
import type { LdseObservabilitySnapshot } from "./types";

let activeRealtimeChannels = 0;

export const ldseObservability = {
  setActiveRealtimeChannels(count: number): void {
    activeRealtimeChannels = count;
  },

  incrementRealtimeChannels(): void {
    activeRealtimeChannels += 1;
  },

  decrementRealtimeChannels(): void {
    activeRealtimeChannels = Math.max(0, activeRealtimeChannels - 1);
  },

  snapshot(): LdseObservabilitySnapshot {
    return {
      cache: ldseCache.getStats(),
      bus: ldseEventBus.getStats(),
      activeRealtimeChannels,
    };
  },
};
