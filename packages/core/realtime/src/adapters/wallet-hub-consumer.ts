import { SRTSP_DOMAIN_EVENTS } from "../registry/domain-events";
import type { SrtspEvent } from "../types";

/** Effet attendu — Wallet Hub financier Phase 3.6. */
export interface WalletHubEventEffect {
  event: string;
  source: string;
  expectedUiEffect: string;
  listens: boolean;
}

/** Alias forward-compat — événements préparation (registry inchangé). */
export const WALLET_HUB_EXTENDED_EVENTS = [
  "wallet.transaction.created",
  "wallet.transaction.completed",
  "wallet.transaction.failed",
  "withdrawal.requested",
  "withdrawal.approved",
  "withdrawal.rejected",
  "payment.completed",
  "payment.failed",
  "wallet.topup.completed",
  "wallet.withdrawal.requested",
  "wallet.subscription.changed",
] as const;

/**
 * Événements actifs — Hub Wallet.
 * Registry certifié + alias LDSE/edge forward-compat.
 */
export const WALLET_HUB_SRTSP_EVENTS = [
  SRTSP_DOMAIN_EVENTS.WALLET_UPDATED,
  SRTSP_DOMAIN_EVENTS.WITHDRAWAL_UPDATED,
  ...WALLET_HUB_EXTENDED_EVENTS,
] as const;

export type WalletHubSrtspEvent = (typeof WALLET_HUB_SRTSP_EVENTS)[number];

/** Préparation — documenté, pas de consommation active Phase 3.6. */
export const WALLET_HUB_PREPARED_EVENTS = [
  SRTSP_DOMAIN_EVENTS.ROYALTY_GENERATED,
  "royalty.adjusted",
  "stream.play.recorded",
] as const;

/** Événements ignorés (bruit publication / wizard). */
export const WALLET_HUB_IGNORED_EVENTS = [
  SRTSP_DOMAIN_EVENTS.PUBLICATION_DRAFT_CREATED,
  SRTSP_DOMAIN_EVENTS.PUBLICATION_DRAFT_UPDATED,
  SRTSP_DOMAIN_EVENTS.PUBLICATION_AUDIO_UPLOADED,
  SRTSP_DOMAIN_EVENTS.PUBLICATION_COVER_UPLOADED,
  SRTSP_DOMAIN_EVENTS.PUBLICATION_METADATA_COMPLETED,
] as const;

export const WALLET_HUB_EVENT_EFFECTS: WalletHubEventEffect[] = [
  {
    event: SRTSP_DOMAIN_EVENTS.WALLET_UPDATED,
    source: "wallet",
    expectedUiEffect: "Solde + contexte wallet actualisés",
    listens: true,
  },
  {
    event: SRTSP_DOMAIN_EVENTS.WITHDRAWAL_UPDATED,
    source: "wallet",
    expectedUiEffect: "Retraits + statuts financiers",
    listens: true,
  },
  {
    event: "payment.completed",
    source: "wallet",
    expectedUiEffect: "Historique paiements + solde",
    listens: true,
  },
  {
    event: "wallet.transaction.completed",
    source: "wallet",
    expectedUiEffect: "Ledger / transactions récentes",
    listens: true,
  },
  {
    event: SRTSP_DOMAIN_EVENTS.ROYALTY_GENERATED,
    source: "wallet",
    expectedUiEffect: "Préparation — non consommé Phase 3.6",
    listens: false,
  },
  {
    event: SRTSP_DOMAIN_EVENTS.PUBLICATION_AUDIO_UPLOADED,
    source: "publication",
    expectedUiEffect: "Ignoré — upload wizard",
    listens: false,
  },
];

export interface WalletHubConsumerScope {
  userId: string;
}

function payloadUserId(event: SrtspEvent): string | undefined {
  const p = event.payload;
  if (typeof p.userId === "string") return p.userId;
  return undefined;
}

/** Filtre consommateur Wallet Hub — scope utilisateur + événements ciblés. */
export function shouldRefreshWalletHub(event: SrtspEvent, scope: WalletHubConsumerScope): boolean {
  if (!(WALLET_HUB_SRTSP_EVENTS as readonly string[]).includes(event.name)) {
    return false;
  }

  const eventUser = payloadUserId(event);
  if (eventUser && eventUser !== scope.userId) return false;

  return true;
}

export function getWalletHubInvalidateEvents(): WalletHubSrtspEvent[] {
  return [...WALLET_HUB_SRTSP_EVENTS];
}

export function isWalletHubIgnoredEvent(eventName: string): boolean {
  return (WALLET_HUB_IGNORED_EVENTS as readonly string[]).includes(eventName);
}

export function isWalletHubPreparedEvent(eventName: string): boolean {
  return (WALLET_HUB_PREPARED_EVENTS as readonly string[]).includes(eventName);
}
