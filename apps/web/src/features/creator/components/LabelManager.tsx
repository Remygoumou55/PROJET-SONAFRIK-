"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge, Button, Card, CardContent, Input } from "@sonafrik/ui";
import type { Label } from "@sonafrik/types";
import { FIELD_LIMITS } from "@sonafrik/shared";
import { useCreatorService } from "../hooks/useCreator";

export function LabelManager({ labels: initial }: { labels: Label[] }) {
  const router = useRouter();
  const creatorService = useCreatorService();
  const [labels, setLabels] = useState(initial);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  async function createLabel(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const label = await creatorService.createLabel({ name, description: description || null });
      setLabels((current) => [label, ...current]);
      setName("");
      setDescription("");
      router.refresh();
    } finally {
      setLoading(false);
    }
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
                  style={{ color: name.length > FIELD_LIMITS.LABEL_NAME * 0.85 ? "#FFC20E" : "#555555" }}
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
                  style={{ color: description.length > FIELD_LIMITS.LABEL_DESCRIPTION * 0.85 ? "#FFC20E" : "#555555" }}
                >
                  {description.length}/{FIELD_LIMITS.LABEL_DESCRIPTION}
                </span>
              </div>
            </div>
            <Button type="submit" disabled={loading || name.length < 2}>
              Créer un label
            </Button>
          </form>
        </CardContent>
      </Card>

      {labels.map((label) => (
        <Card key={label.id}>
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="text-texte-principal font-semibold">{label.name}</p>
              <p className="text-texte-desactive text-xs">{label.slug}</p>
            </div>
            {label.verified ? <Badge variant="verified">Vérifié</Badge> : <Badge variant="outline">En attente</Badge>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
