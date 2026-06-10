"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge, Button, Card, CardContent, Input } from "@sonafrik/ui";
import type { Label } from "@sonafrik/types";
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
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom du label" />
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optionnel)"
            />
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
