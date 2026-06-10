"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent, CardHeader, CardTitle, Modal } from "@sonafrik/ui";
import { useIdentityService } from "../hooks/useIdentity";

export function AccountDeletionPanel() {
  const router = useRouter();
  const identity = useIdentityService();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmDeletion() {
    setLoading(true);
    setError(null);
    try {
      await identity.requestAccountDeletion();
      router.push("/auth/connexion");
    } catch {
      setError("Impossible de supprimer le compte pour le moment.");
      setLoading(false);
    }
  }

  return (
    <>
      <Card className="border-rouge-alerte/30">
        <CardHeader>
          <CardTitle className="text-rouge-alerte">Zone de danger</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-texte-secondaire text-sm">
            La suppression de votre compte désactive votre profil SONAFRIK. Cette action est
            enregistrée dans les journaux d&apos;audit (INSERT ONLY) conformément au CDC.
          </p>
          {error ? <p className="text-rouge-alerte text-sm">{error}</p> : null}
          <Button variant="destructive" onClick={() => setOpen(true)}>
            Supprimer mon compte
          </Button>
        </CardContent>
      </Card>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Confirmer la suppression"
        description="Cette action est irréversible. Vous serez déconnecté immédiatement."
      >
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button variant="destructive" disabled={loading} onClick={confirmDeletion}>
            {loading ? "Suppression…" : "Confirmer"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
