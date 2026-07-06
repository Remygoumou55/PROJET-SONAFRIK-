"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createListenerService } from "@sonafrik/api/listener";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { usePlayer } from "../hooks/usePlayer";

export function ListenTrackDeepLink({ trackId }: { trackId: string | null }) {
  const { loadAndPlay } = usePlayer();
  const listener = useMemo(() => createListenerService(getSupabaseBrowserClient()), []);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!trackId || startedRef.current) return;
    startedRef.current = true;
    let cancelled = false;

    void (async () => {
      try {
        const track = await listener.getPublishedTrackById(trackId);
        if (cancelled) return;
        if (!track) {
          setError("Ce morceau n'est pas disponible à l'écoute.");
          return;
        }
        await loadAndPlay(track);
        if (!cancelled && typeof window !== "undefined") {
          const url = new URL(window.location.href);
          url.searchParams.delete("track");
          window.history.replaceState({}, "", url.pathname + url.search);
        }
      } catch {
        if (!cancelled) setError("Impossible de lancer la lecture de ce morceau.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [trackId, listener, loadAndPlay]);

  if (!trackId) return null;

  if (error) {
    return (
      <p className="mx-4 my-3 text-sm text-center" role="alert" style={{ color: "var(--color-erreur)" }}>
        {error}
      </p>
    );
  }

  return (
    <p className="mx-4 my-3 text-sm text-center" style={{ color: "var(--color-texte-secondaire)" }} aria-live="polite">
      Lancement de la lecture…
    </p>
  );
}
