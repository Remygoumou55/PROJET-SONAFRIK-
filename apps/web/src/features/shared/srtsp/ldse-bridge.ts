"use client";

import { useEffect } from "react";
import { LDSE_TO_SRTSP_EVENT_MAP } from "@sonafrik/realtime/events";
import { useSrtspOptional } from "@sonafrik/realtime/react";
import { ldseEventBus } from "@/features/shared/ldse/event-bus";
import type { LdseEvent } from "@/features/shared/ldse/types";

function mapLdseToSrtsp(event: LdseEvent): string {
  return LDSE_TO_SRTSP_EVENT_MAP[event.type] ?? event.type;
}

function resolveSource(eventType: string): "catalog" | "creator" | "wallet" | "admin" | "system" {
  if (eventType.startsWith("creator.")) return "creator";
  if (eventType.startsWith("wallet.")) return "wallet";
  if (eventType.startsWith("admin.")) return "admin";
  if (eventType.startsWith("catalog.") || eventType.startsWith("publication.")) return "catalog";
  return "system";
}

/**
 * Pont LDSE → SRTSP — forward passif sans modifier le bus LDSE ni les modules certifiés.
 * Intégration progressive : les modules continuent d'utiliser publishCreatorLdseEvent, etc.
 */
export function useLdseSrtspBridge(enabled = true): void {
  const srtsp = useSrtspOptional();

  useEffect(() => {
    if (!enabled || !srtsp) return;

    return ldseEventBus.subscribeAll((ldseEvent) => {
      const name = mapLdseToSrtsp(ldseEvent);
      const payload = (ldseEvent.payload ?? {}) as Record<string, unknown>;

      srtsp.publish({
        name,
        payload,
        source: resolveSource(ldseEvent.type),
        dedupeKey: `ldse:${ldseEvent.type}:${JSON.stringify(payload)}:${ldseEvent.at}`,
      });
    });
  }, [enabled, srtsp]);
}
