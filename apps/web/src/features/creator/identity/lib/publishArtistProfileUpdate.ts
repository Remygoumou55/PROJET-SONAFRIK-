import { SRTSP_DOMAIN_EVENTS } from "@sonafrik/realtime/registry";
import { ldseEventBus } from "@/features/shared/ldse/event-bus";

/** Invalidation ciblée profil artiste via LDSE/SRTSP. */
export function publishArtistProfileUpdate(creatorId: string): void {
  ldseEventBus.publish(SRTSP_DOMAIN_EVENTS.ARTIST_UPDATED, { creatorId });
}
