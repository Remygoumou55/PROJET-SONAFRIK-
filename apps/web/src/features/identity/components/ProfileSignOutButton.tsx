"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAuthService } from "@sonafrik/api/auth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@sonafrik/ui";

export function ProfileSignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignOut() {
    setLoading(true);
    setError(null);
    try {
      const auth = createAuthService(getSupabaseBrowserClient());
      await auth.signOut();
      router.push("/auth/connexion");
      router.refresh();
    } catch {
      setError("Impossible de se déconnecter. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="identity-profile__signout">
      {error ? (
        <p className="text-sm mb-2" role="alert" style={{ color: "var(--color-erreur)" }}>
          {error}
        </p>
      ) : null}
      <Button type="button" variant="outline" size="sm" disabled={loading} onClick={() => void handleSignOut()}>
        {loading ? "Déconnexion…" : "Se déconnecter"}
      </Button>
    </div>
  );
}
