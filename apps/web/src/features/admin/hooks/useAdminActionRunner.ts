"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ADMIN_ACTION_FALLBACK_ERROR } from "../lib/adminActionShared";

type ActionFn<T extends Record<string, unknown> = Record<string, unknown>> = () => Promise<
  { error?: string } & T
>;

interface RunOptions<T> {
  refresh?: boolean;
  onSuccess?: (result: { error?: string } & T) => void;
}

/**
 * Exécute une server action admin avec gestion d'erreur unifiée.
 * Pattern obligatoire pour tous les boutons d'action back-office.
 */
export function useAdminActionRunner() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const run = useCallback(
    async <T extends Record<string, unknown> = Record<string, unknown>>(
      fn: ActionFn<T>,
      options?: RunOptions<T>,
    ): Promise<({ error?: string } & T) | null> => {
      setError(null);
      try {
        const result = await fn();
        if (result.error) {
          setError(result.error);
          return result;
        }
        options?.onSuccess?.(result);
        if (options?.refresh !== false) {
          startTransition(() => router.refresh());
        }
        return result;
      } catch (err) {
        const message =
          err instanceof TypeError && /fetch/i.test(err.message)
            ? "Connexion interrompue — réessayez."
            : ADMIN_ACTION_FALLBACK_ERROR;
        setError(message);
        return null;
      }
    },
    [router],
  );

  const clearError = useCallback(() => setError(null), []);

  return { error, setError, clearError, isPending, run };
}
