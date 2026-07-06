"use client";

import { useCallback, useState } from "react";
import { ADMIN_LDSE_EVENTS } from "@/features/shared/ldse/admin/admin-ldse-config";
import { publishAdminLdseEvent } from "@/features/shared/ldse/admin/AdminLdseProvider";
import { ADMIN_ACTION_FALLBACK_ERROR } from "../lib/adminActionShared";

type ActionFn<T extends Record<string, unknown> = Record<string, unknown>> = () => Promise<
  { error?: string } & T
>;

interface RunOptions<T> {
  /** Opt-in snapshot invalidate (défaut : false — préférer ldseEvent). */
  refresh?: boolean;
  onSuccess?: (result: { error?: string } & T) => void;
  /** Publie un événement LDSE après succès (sync sidebar / dashboard sans F5). */
  ldseEvent?: {
    type: Parameters<typeof publishAdminLdseEvent>[0];
    payload?: Record<string, unknown>;
  };
}

/**
 * Exécute une server action admin avec gestion d'erreur unifiée.
 * Pattern obligatoire pour tous les boutons d'action back-office.
 */
export function useAdminActionRunner() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const run = useCallback(
    async <T extends Record<string, unknown> = Record<string, unknown>>(
      fn: ActionFn<T>,
      options?: RunOptions<T>,
    ): Promise<({ error?: string } & T) | null> => {
      setError(null);
      setIsPending(true);
      try {
        const result = await fn();
        if (result.error) {
          setError(result.error);
          return result;
        }
        options?.onSuccess?.(result);
        if (options?.ldseEvent) {
          publishAdminLdseEvent(options.ldseEvent.type, options.ldseEvent.payload);
        } else if (options?.refresh === true) {
          publishAdminLdseEvent(ADMIN_LDSE_EVENTS.snapshotInvalidate);
        }
        return result;
      } catch (err) {
        const message =
          err instanceof TypeError && /fetch/i.test(err.message)
            ? "Connexion interrompue — réessayez."
            : ADMIN_ACTION_FALLBACK_ERROR;
        setError(message);
        return null;
      } finally {
        setIsPending(false);
      }
    },
    [],
  );

  const clearError = useCallback(() => setError(null), []);

  return { error, setError, clearError, isPending, run };
}
