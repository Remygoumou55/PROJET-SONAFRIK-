import { ldseEventBus } from "../event-bus";
import { invalidateLdseQuery } from "../useLdseQuery";
import { CREATOR_LDSE_EVENTS, CREATOR_LDSE_KEYS } from "./creator-ldse-config";

/** Publie invalidation catalog/analytics après mutation créateur. */
export function publishCreatorLdseEvent(
  type: (typeof CREATOR_LDSE_EVENTS)[keyof typeof CREATOR_LDSE_EVENTS],
  creatorId: string,
  payload?: Record<string, unknown>,
): void {
  ldseEventBus.publish(type, { creatorId, ...payload });
  ldseEventBus.publish(CREATOR_LDSE_EVENTS.catalogInvalidate, { creatorId, ...payload });
  invalidateLdseQuery(CREATOR_LDSE_KEYS.catalogSummary(creatorId));
  invalidateLdseQuery(CREATOR_LDSE_KEYS.analyticsKpis(creatorId));
  invalidateLdseQuery(CREATOR_LDSE_KEYS.tracksList(creatorId));
  invalidateLdseQuery(CREATOR_LDSE_KEYS.albumsList(creatorId));
}
