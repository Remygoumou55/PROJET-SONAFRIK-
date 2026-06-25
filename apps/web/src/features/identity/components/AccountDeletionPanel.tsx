"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Modal } from "@sonafrik/ui";
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
      setError("Impossible de supprimer le compte pour le moment. Réessayez ou contactez le support.");
      setLoading(false);
    }
  }

  return (
    <>
      <section className="identity-account-danger" aria-labelledby="account-danger-title">
        <h3 id="account-danger-title" className="identity-account-danger__title">
          Supprimer mon compte
        </h3>
        <p className="identity-account-danger__text">
          Cette action désactive définitivement votre profil SONAFRIK. Vos écoutes, playlists et
          contenus associés ne seront plus accessibles. Conformément à la loi, certaines traces
          de sécurité peuvent être conservées.
        </p>
        {error ? <p className="identity-account-danger__error">{error}</p> : null}
        <Button variant="destructive" onClick={() => setOpen(true)}>
          Supprimer mon compte
        </Button>
      </section>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Confirmer la suppression"
        description="Cette action est irréversible. Vous serez déconnecté immédiatement de tous vos appareils."
      >
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button variant="destructive" disabled={loading} onClick={confirmDeletion}>
            {loading ? "Suppression…" : "Confirmer la suppression"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
