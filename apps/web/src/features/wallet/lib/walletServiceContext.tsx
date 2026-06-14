"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { createWalletService } from "@sonafrik/api/wallet";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type WalletServiceInstance = ReturnType<typeof createWalletService>;

const WalletServiceContext = createContext<WalletServiceInstance | null>(null);

export function WalletServiceProvider({ children }: { children: ReactNode }) {
  const service = useMemo(() => createWalletService(getSupabaseBrowserClient()), []);
  return (
    <WalletServiceContext.Provider value={service}>
      {children}
    </WalletServiceContext.Provider>
  );
}

export function useWalletService(): WalletServiceInstance {
  const ctx = useContext(WalletServiceContext);
  if (!ctx) throw new Error("useWalletService doit être utilisé dans <WalletServiceProvider>");
  return ctx;
}
