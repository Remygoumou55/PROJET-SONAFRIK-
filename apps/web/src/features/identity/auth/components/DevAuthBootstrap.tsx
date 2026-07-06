"use client";

import { useEffect } from "react";

const SKIP_BOOTSTRAP =
  process.env.NODE_ENV !== "development" ||
  process.env.NEXT_PUBLIC_LOCAL_AUDIT_MODE === "true" ||
  process.env.NEXT_PUBLIC_BYPASS_AUTH !== "true";

/**
 * En dev avec BYPASS_AUTH : provisionne une vraie session Supabase (cookies SSR)
 * pour que stream-start et les edge functions reçoivent un JWT valide.
 * Désactivé en mode Live Control (LOCAL_AUDIT) — import Supabase différé.
 */
export function DevAuthBootstrap() {
  useEffect(() => {
    if (SKIP_BOOTSTRAP) return;

    void (async () => {
      try {
        const { getSupabaseBrowserClient } = await import("@/lib/supabase/client");
        const supabase = getSupabaseBrowserClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.access_token) {
          const { data: isArtist } = await supabase.rpc("is_artist_account", {
            p_user_id: session.user.id,
          });
          if (isArtist) return;
        }
        await fetch("/api/e2e/session?role=creator", { method: "POST" });
      } catch {
        // silencieux — l'utilisateur pourra se connecter manuellement
      }
    })();
  }, []);

  return null;
}
