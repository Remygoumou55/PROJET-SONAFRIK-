"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, CardContent, Modal } from "@sonafrik/ui";
import type { UserSession } from "@sonafrik/types";
import { useIdentityService } from "../hooks/useIdentity";
import { useAuthService } from "@/features/identity/auth/hooks/useAuth";
import { formatDateWithTime } from "@/lib/formatters";

interface SessionListProps {
  sessions: UserSession[];
}

const PLATFORM_LABELS: Record<string, string> = {
  web: "Web",
  ios: "iOS",
  android: "Android",
};

export function SessionList({ sessions: initial }: SessionListProps) {
  const router = useRouter();
  const identity = useIdentityService();
  const auth = useAuthService();
  const [sessions, setSessions] = useState(initial);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [signOutAllOpen, setSignOutAllOpen] = useState(false);
  const [signingOutAll, setSigningOutAll] = useState(false);
  const [signOutAllError, setSignOutAllError] = useState<string | null>(null);

  async function revokeSession(sessionId: string) {
    setLoadingId(sessionId);
    try {
      await identity.revokeSession(sessionId);
      setSessions((current) => current.filter((session) => session.id !== sessionId));
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  }

  async function handleSignOutEverywhere() {
    setSigningOutAll(true);
    setSignOutAllError(null);
    try {
      await auth.signOutEverywhere();
      router.push("/");
    } catch (err) {
      setSignOutAllError(err instanceof Error ? err.message : "Erreur lors de la déconnexion globale.");
    } finally {
      setSigningOutAll(false);
    }
  }

  return (
    <>
      <div className="space-y-3">
        {sessions.length === 0 ? (
          <Card>
            <CardContent className="text-texte-secondaire py-12 text-center text-sm">
              Aucun appareil connecté pour le moment.
            </CardContent>
          </Card>
        ) : (
          sessions.map((session) => (
            <Card key={session.id}>
              <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="text-texte-principal font-medium">
                    {session.device_name ?? "Appareil inconnu"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {session.platform ? (
                      <Badge variant="outline">{PLATFORM_LABELS[session.platform] ?? session.platform}</Badge>
                    ) : null}
                    <span className="text-texte-desactive text-xs">
                      Dernière activité · {formatDateWithTime(session.last_active_at)}
                    </span>
                  </div>
                  {session.ip_address ? (
                    <p className="text-texte-desactive text-xs">IP · {session.ip_address}</p>
                  ) : null}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={loadingId === session.id}
                  onClick={() => revokeSession(session.id)}
                >
                  Révoquer
                </Button>
              </CardContent>
            </Card>
          ))
        )}

        <div className="border-bordure space-y-3 border-t pt-6">
          {signOutAllError ? (
            <p className="text-rouge-alerte text-sm">{signOutAllError}</p>
          ) : null}
          <button
            type="button"
            onClick={() => setSignOutAllOpen(true)}
            className="hover:bg-rouge-alerte/5 w-full rounded-xl px-[18px] py-3 text-sm font-medium transition-colors"
            style={{
              background: "transparent",
              border: "1px solid rgba(255, 77, 79, 0.3)",
              color: "var(--color-danger)",
            }}
          >
            Se déconnecter de tous les appareils
          </button>
        </div>
      </div>

      <Modal
        open={signOutAllOpen}
        onOpenChange={setSignOutAllOpen}
        title="Déconnecter tous les appareils"
        description="Cette action vous déconnectera de tous vos appareils, y compris celui-ci. Continuer ?"
      >
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setSignOutAllOpen(false)}>
            Annuler
          </Button>
          <Button
            variant="destructive"
            disabled={signingOutAll}
            onClick={handleSignOutEverywhere}
          >
            {signingOutAll ? "Déconnexion…" : "Confirmer la déconnexion"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
