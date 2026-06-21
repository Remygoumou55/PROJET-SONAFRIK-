"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge, Button, Card, CardContent, Input } from "@sonafrik/ui";
import type { Label } from "@sonafrik/types";
import { FIELD_LIMITS } from "@sonafrik/shared";
import { useCreatorService } from "../hooks/useCreator";

interface EditState {
  name: string;
  description: string;
}

function LabelCard({
  label,
  onDelete,
  onUpdate,
}: {
  label: Label;
  onDelete: (id: string) => Promise<void>;
  onUpdate: (id: string, name: string, description: string) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [edit, setEdit] = useState<EditState>({
    name: label.name,
    description: label.description ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (edit.name.trim().length < 2) {
      setError("Le nom doit faire au moins 2 caractères.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onUpdate(label.id, edit.name.trim(), edit.description.trim());
      setIsEditing(false);
    } catch {
      setError("Impossible de mettre à jour le label.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    try {
      await onDelete(label.id);
    } finally {
      setBusy(false);
      setConfirmDelete(false);
    }
  }

  return (
    <Card>
      <CardContent className="py-4 space-y-3">
        {isEditing ? (
          <div className="space-y-2">
            <div className="space-y-1">
              <Input
                value={edit.name}
                maxLength={FIELD_LIMITS.LABEL_NAME}
                onChange={(e) => setEdit((s) => ({ ...s, name: e.target.value }))}
                placeholder="Nom du label"
                autoFocus
              />
              <div className="flex justify-end">
                <span
                  className="text-xs"
                  style={{ color: edit.name.length > FIELD_LIMITS.LABEL_NAME * 0.85 ? "var(--color-or-solaire)" : "var(--color-texte-desactive)" }}
                >
                  {edit.name.length}/{FIELD_LIMITS.LABEL_NAME}
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <Input
                value={edit.description}
                maxLength={FIELD_LIMITS.LABEL_DESCRIPTION}
                onChange={(e) => setEdit((s) => ({ ...s, description: e.target.value }))}
                placeholder="Description (optionnel)"
              />
              <div className="flex justify-end">
                <span
                  className="text-xs"
                  style={{ color: edit.description.length > FIELD_LIMITS.LABEL_DESCRIPTION * 0.85 ? "var(--color-or-solaire)" : "var(--color-texte-desactive)" }}
                >
                  {edit.description.length}/{FIELD_LIMITS.LABEL_DESCRIPTION}
                </span>
              </div>
            </div>
            {error && <p className="text-sm" style={{ color: "var(--color-danger)" }}>{error}</p>}
            <div className="flex gap-2">
              <Button size="sm" disabled={busy} onClick={handleSave}>
                {busy ? "Enregistrement…" : "Enregistrer"}
              </Button>
              <Button size="sm" variant="outline" disabled={busy} onClick={() => { setIsEditing(false); setError(null); }}>
                Annuler
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-texte-principal font-semibold">{label.name}</p>
              {label.description && (
                <p className="text-texte-desactive text-xs mt-0.5">{label.description}</p>
              )}
              <p className="text-texte-desactive text-xs mt-0.5">{label.slug}</p>
            </div>
            <div className="flex items-center gap-2">
              {label.verified ? (
                <Badge variant="verified">Vérifié</Badge>
              ) : (
                <Badge variant="outline">En attente</Badge>
              )}
              <Button size="sm" variant="outline" disabled={busy} onClick={() => setIsEditing(true)}>
                Modifier
              </Button>
              {confirmDelete ? (
                <div className="flex items-center gap-1">
                  <Button size="sm" disabled={busy} onClick={handleDelete}>
                    {busy ? "…" : "Confirmer"}
                  </Button>
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => setConfirmDelete(false)}>
                    Non
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => setConfirmDelete(true)}
                  style={{ color: "var(--color-erreur)", borderColor: "rgba(255,68,68,0.2)" }}
                >
                  Supprimer
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function LabelManager({ labels: initial }: { labels: Label[] }) {
  const router = useRouter();
  const creatorService = useCreatorService();
  const [labels, setLabels] = useState(initial);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  async function createLabel(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setCreateError(null);
    try {
      const label = await creatorService.createLabel({ name, description: description || null });
      setLabels((current) => [label, ...current]);
      setName("");
      setDescription("");
      router.refresh();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Impossible de créer le label.");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(id: string, newName: string, newDescription: string) {
    const updated = await creatorService.updateLabel(id, {
      name: newName,
      description: newDescription || null,
    });
    setLabels((current) => current.map((l) => (l.id === id ? updated : l)));
    router.refresh();
  }

  async function handleDelete(id: string) {
    await creatorService.deleteLabel(id);
    setLabels((current) => current.filter((l) => l.id !== id));
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="py-4">
          <form onSubmit={createLabel} className="space-y-3">
            <div className="space-y-1">
              <Input
                value={name}
                maxLength={FIELD_LIMITS.LABEL_NAME}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nom du label"
              />
              <div className="flex justify-end">
                <span
                  className="text-xs"
                  style={{ color: name.length > FIELD_LIMITS.LABEL_NAME * 0.85 ? "var(--color-or-solaire)" : "var(--color-texte-desactive)" }}
                >
                  {name.length}/{FIELD_LIMITS.LABEL_NAME}
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <Input
                value={description}
                maxLength={FIELD_LIMITS.LABEL_DESCRIPTION}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optionnel)"
              />
              <div className="flex justify-end">
                <span
                  className="text-xs"
                  style={{ color: description.length > FIELD_LIMITS.LABEL_DESCRIPTION * 0.85 ? "var(--color-or-solaire)" : "var(--color-texte-desactive)" }}
                >
                  {description.length}/{FIELD_LIMITS.LABEL_DESCRIPTION}
                </span>
              </div>
            </div>
            {createError && <p className="text-sm" style={{ color: "var(--color-danger)" }}>{createError}</p>}
            <Button type="submit" disabled={loading || name.length < 2}>
              {loading ? "Création…" : "Créer un label"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {labels.length === 0 ? (
        <Card>
          <CardContent className="text-texte-secondaire py-8 text-center text-sm">
            Aucun label. Créez-en un ci-dessus.
          </CardContent>
        </Card>
      ) : (
        labels.map((label) => (
          <LabelCard
            key={label.id}
            label={label}
            onDelete={handleDelete}
            onUpdate={handleUpdate}
          />
        ))
      )}
    </div>
  );
}
