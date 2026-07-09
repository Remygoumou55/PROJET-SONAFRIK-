"use client";

import { useEffect, useState } from "react";
import { DEV_MOCK_CREATOR_ID } from "@sonafrik/shared/auth";
import type { createCreatorService } from "@sonafrik/api/creator";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useCreatorService } from "./useCreator";
import { toUserFacingUploadError } from "@/features/shared/feedback/userFacingError";

type CreatorService = ReturnType<typeof createCreatorService>;

export function resolveCreatorUploadError(err: unknown, fallback: string): string {
  return toUserFacingUploadError(err, fallback);
}

/** Bloque l'upload si le navigateur n'a pas de session JWT (edge functions). */
export async function assertBrowserSessionForUpload(): Promise<void> {
  const { data: { session } } = await getSupabaseBrowserClient().auth.getSession();
  if (!session?.access_token) {
    throw new Error("Connectez-vous pour enregistrer vos images.");
  }
}

export async function resolveCreatorIdForUpload(
  creatorService: CreatorService,
  fallbackCreatorId: string,
): Promise<string> {
  try {
    const creator = await creatorService.ensureCreator();
    return creator.id;
  } catch {
    if (fallbackCreatorId !== DEV_MOCK_CREATOR_ID) return fallbackCreatorId;
    throw new Error("Connectez-vous pour enregistrer une image.");
  }
}

/**
 * Résout le creatorId réel côté client (session Supabase), même en local control.
 */
export function useEffectiveCreatorId(fallbackCreatorId: string): {
  creatorId: string;
  resolving: boolean;
} {
  const creatorService = useCreatorService();
  const [creatorId, setCreatorId] = useState(fallbackCreatorId);
  const [resolving, setResolving] = useState(fallbackCreatorId === DEV_MOCK_CREATOR_ID);

  useEffect(() => {
    let cancelled = false;

    void creatorService
      .ensureCreator()
      .then((creator) => {
        if (!cancelled) {
          setCreatorId(creator.id);
          setResolving(false);
        }
      })
      .catch(() => {
        if (!cancelled) setResolving(false);
      });

    return () => {
      cancelled = true;
    };
  }, [creatorService, fallbackCreatorId]);

  return { creatorId, resolving };
}
