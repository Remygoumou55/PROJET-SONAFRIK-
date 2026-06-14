"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, CardContent } from "@sonafrik/ui";
import type { UserSession } from "@sonafrik/types";
import { useIdentityService } from "../hooks/useIdentity";
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
  const [sessions, setSessions] = useState(initial);
  const [loadingId, setLoadingId] = useState<string | null>(null);

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

  if (!sessions.length) {
    return (
      <Card>
        <CardContent className="text-texte-secondaire py-12 text-center text-sm">
          Aucune session active enregistrée.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((session) => (
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
      ))}
    </div>
  );
}

