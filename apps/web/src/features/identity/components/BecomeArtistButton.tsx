"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@sonafrik/ui";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { createCreatorService } from "@sonafrik/api";

export function BecomeArtistButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const service = createCreatorService(supabase);
      await service.becomeArtist();
      router.push("/creator/identity");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("déjà artiste")) {
        router.push("/creator/identity");
        return;
      }
      setError("Impossible d'activer le compte artiste. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {error && (
        <p className="text-xs mb-3" role="alert" style={{ color: "var(--color-danger)" }}>
          {error}
        </p>
      )}
      <Button
        variant="premium"
        size="sm"
        onClick={() => void handleClick()}
        disabled={loading}
      >
        {loading ? "Activation en cours…" : "Activer mon espace artiste"}
      </Button>
    </>
  );
}
