"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { LISTENER_LDSE_EVENTS } from "@/features/shared/ldse/listener/listener-ldse-config";
import { publishListenerLdseEvent } from "@/features/shared/ldse/listener/publishListenerLdseEvent";
import { useSocialService } from "./useSocial";

export function useFavorite(entityType: "track" | "album", entityId: string) {
  const social = useSocialService();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!entityId) return;
    let cancelled = false;
    void social
      .isFavorited({ entityType, entityId })
      .then((fav) => {
        if (!cancelled) setIsFavorited(fav);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [entityId, entityType, social]);

  const toggleFavorite = useCallback(async () => {
    if (!entityId || isLoading) return isFavorited;
    setIsLoading(true);
    try {
      const next = await social.toggleFavorite({ entityType, entityId });
      setIsFavorited(next);
      const { data: { user } } = await getSupabaseBrowserClient().auth.getUser();
      if (user?.id) {
        publishListenerLdseEvent(LISTENER_LDSE_EVENTS.favoriteToggled, user.id, {
          entityType,
          entityId,
          isFavorited: next,
        });
        publishListenerLdseEvent(LISTENER_LDSE_EVENTS.libraryInvalidate, user.id, {});
      }
      return next;
    } finally {
      setIsLoading(false);
    }
  }, [entityId, entityType, isFavorited, isLoading, social]);

  return { isFavorited, toggleFavorite, isLoading };
}
