"use client";

import { useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * En dev avec BYPASS_AUTH : provisionne une vraie session Supabase (cookies SSR)
 * pour que stream-start et les edge functions reçoivent un JWT valide.
 */
export function DevAuthBootstrap() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    if (process.env.NEXT_PUBLIC_BYPASS_AUTH !== "true") return;

    const supabase = getSupabaseBrowserClient();
    void supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.access_token) return;
      try {
        await fetch("/api/e2e/session", { method: "POST" });
      } catch {
        // silencieux — l'utilisateur pourra se connecter manuellement
      }
    });
  }, []);

  return null;
}
