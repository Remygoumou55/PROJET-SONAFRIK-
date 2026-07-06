import { describe, expect, it } from "vitest";
import { SRTSP_DOMAIN_EVENTS } from "../src/registry/domain-events";
import {
  WALLET_HUB_EXTENDED_EVENTS,
  WALLET_HUB_IGNORED_EVENTS,
  WALLET_HUB_PREPARED_EVENTS,
  WALLET_HUB_SRTSP_EVENTS,
  isWalletHubIgnoredEvent,
  isWalletHubPreparedEvent,
  shouldRefreshWalletHub,
} from "../src/adapters/wallet-hub-consumer";
import type { SrtspEvent } from "../src/types";

const USER_ID = "770e8400-e29b-41d4-a716-446655440002";
const OTHER = "880e8400-e29b-41d4-a716-446655440003";

function evt(name: string, payload: Record<string, unknown>): SrtspEvent {
  return {
    id: "e1",
    name,
    type: "domain",
    version: 1,
    payload,
    source: "wallet",
    destinations: ["wallet"],
    timestamp: Date.now(),
  };
}

describe("Wallet Hub SRTSP consumer", () => {
  it("écoute balance / withdrawal / payment / transaction", () => {
    for (const name of [
      SRTSP_DOMAIN_EVENTS.WALLET_UPDATED,
      SRTSP_DOMAIN_EVENTS.WITHDRAWAL_UPDATED,
      "payment.completed",
      "wallet.transaction.completed",
      "wallet.topup.completed",
    ]) {
      expect(shouldRefreshWalletHub(evt(name, { userId: USER_ID }), { userId: USER_ID })).toBe(true);
    }
  });

  it("ignore événements publication wizard", () => {
    for (const name of WALLET_HUB_IGNORED_EVENTS) {
      expect(isWalletHubIgnoredEvent(name)).toBe(true);
      expect(shouldRefreshWalletHub(evt(name, { userId: USER_ID }), { userId: USER_ID })).toBe(false);
    }
  });

  it("prépare royalty/stream sans consommation active", () => {
    for (const name of WALLET_HUB_PREPARED_EVENTS) {
      expect(isWalletHubPreparedEvent(name)).toBe(true);
      expect(WALLET_HUB_SRTSP_EVENTS as readonly string[]).not.toContain(name);
      expect(shouldRefreshWalletHub(evt(name, { userId: USER_ID }), { userId: USER_ID })).toBe(false);
    }
  });

  it("ignore autre utilisateur", () => {
    expect(
      shouldRefreshWalletHub(
        evt(SRTSP_DOMAIN_EVENTS.WALLET_UPDATED, { userId: OTHER }),
        { userId: USER_ID },
      ),
    ).toBe(false);
  });

  it("couvre alias extended prep", () => {
    for (const name of WALLET_HUB_EXTENDED_EVENTS) {
      expect(WALLET_HUB_SRTSP_EVENTS as readonly string[]).toContain(name);
    }
  });

  it("accepte wallet.balance.updated sans userId explicite", () => {
    expect(
      shouldRefreshWalletHub(evt(SRTSP_DOMAIN_EVENTS.WALLET_UPDATED, {}), { userId: USER_ID }),
    ).toBe(true);
  });
});
