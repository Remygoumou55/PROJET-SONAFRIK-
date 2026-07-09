"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { DEV_MOCK_USER_ID, isClientLocalControlMode } from "@sonafrik/shared/auth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface WalletSessionContextValue {
  userId: string | null;
  ready: boolean;
}

const WalletSessionContext = createContext<WalletSessionContextValue | null>(null);

export function WalletSessionProvider({
  userId: serverUserId,
  children,
}: {
  userId: string;
  children: ReactNode;
}) {
  return (
    <WalletSessionContext.Provider value={{ userId: serverUserId, ready: true }}>
      {children}
    </WalletSessionContext.Provider>
  );
}

/** Identifiant utilisateur wallet — SSR via layout, repli client si hors provider. */
export function useWalletUserId(): { userId: string | null; ready: boolean } {
  const session = useContext(WalletSessionContext);
  const [clientUserId, setClientUserId] = useState<string | null>(() =>
    isClientLocalControlMode() ? DEV_MOCK_USER_ID : null,
  );
  const [clientReady, setClientReady] = useState(() => isClientLocalControlMode());

  useEffect(() => {
    if (session?.ready) return;

    if (isClientLocalControlMode()) {
      setClientUserId(DEV_MOCK_USER_ID);
      setClientReady(true);
      return;
    }

    let cancelled = false;
    void getSupabaseBrowserClient()
      .auth.getUser()
      .then(({ data }) => {
        if (!cancelled) setClientUserId(data.user?.id ?? null);
      })
      .catch(() => {
        if (!cancelled) setClientUserId(null);
      })
      .finally(() => {
        if (!cancelled) setClientReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [session?.ready]);

  if (session?.ready) {
    return { userId: session.userId, ready: true };
  }

  return { userId: clientUserId, ready: clientReady };
}
