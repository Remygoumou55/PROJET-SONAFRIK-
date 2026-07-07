"use client";

import { useEffect } from "react";
import { isClientLocalControlMode } from "@sonafrik/shared/auth";

const SKIP_BOOTSTRAP =
  process.env.NODE_ENV !== "development" ||
  process.env.NEXT_PUBLIC_LOCAL_AUDIT_MODE === "true" ||
  !isClientLocalControlMode();

/**
 * En dev local control : provisionne une vraie session Supabase (cookies SSR)
 * pour que les edge functions (upload assets, stream-start) reçoivent un JWT valide.
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
