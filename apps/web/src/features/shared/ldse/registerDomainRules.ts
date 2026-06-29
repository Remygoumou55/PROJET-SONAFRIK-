import { registerLdseInvalidationRule } from "./invalidate-map";
import { WALLET_LDSE_EVENTS, WALLET_LDSE_KEYS } from "./wallet/wallet-ldse-config";

let registered = false;

/** Enregistre les règles d'invalidation LDSE globales (exact keys). */
export function registerLdseDomainRules(): void {
  if (registered) return;
  registered = true;

  registerLdseInvalidationRule({
    event: WALLET_LDSE_EVENTS.invalidate,
    keys: Object.values(WALLET_LDSE_KEYS),
  });
}
