import { ldseEventBus } from "../event-bus";
import { invalidateLdseQuery } from "../useLdseQuery";
import { WALLET_LDSE_EVENTS, WALLET_LDSE_KEYS } from "./wallet-ldse-config";

export function publishWalletLdseEvent(
  type: (typeof WALLET_LDSE_EVENTS)[keyof typeof WALLET_LDSE_EVENTS],
  payload?: Record<string, unknown>,
): void {
  ldseEventBus.publish(type, payload);
  ldseEventBus.publish(WALLET_LDSE_EVENTS.invalidate, payload);
  for (const key of Object.values(WALLET_LDSE_KEYS)) {
    invalidateLdseQuery(key);
  }
}
