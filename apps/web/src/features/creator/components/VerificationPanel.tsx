"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Badge, Button, Card, CardContent } from "@sonafrik/ui";
import type { Creator, CreatorVerification } from "@sonafrik/types";
import { VERIFICATION_STATUS_LABELS, VERIFICATION_TYPE_LABELS } from "@sonafrik/types";
import { useCreatorService } from "../hooks/useCreator";

export function VerificationPanel({
  creator,
  verifications: initial,
}: {
  creator: Creator;
  verifications: CreatorVerification[];
}) {
  const router = useRouter();
  const creatorService = useCreatorService();
  const fileRef = useRef<HTMLInputElement>(null);
  const [verifications, setVerifications] = useState(initial);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Track which verifications had a successful doc upload in this session
  const [uploadedIds, setUploadedIds] = useState<Set<string>>(new Set());

  async function create(type: "identity" | "artist" | "label") {
    setLoading(true);
    setError(null);
    try {
      const v = await creatorService.createVerification({
        verificationType: type,
        documentType: type === "label" ? "business_license" : "national_id",
      });
      setVerifications((current) => [v, ...current]);
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Impossible de créer la demande de vérification. Réessayez.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function uploadDoc(verificationId: string, file: File) {
    const { signedUrl, token } = await creatorService.requestAssetUploadUrl({
      creatorId: creator.id,
      assetKind: "verification",
      contentType: file.type as "image/jpeg" | "image/png" | "image/webp" | "application/pdf",
      verificationId,
    });

    const res = await fetch(signedUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type, ...(token ? { "x-upsert": "true" } : {}) },
      body: file,
    });

    if (!res.ok) {
      throw new Error(`Erreur envoi document (${res.status})`);
    }
  }

  async function submit(id: string) {
    setLoading(true);
    setError(null);
    try {
      await creatorService.submitVerification(id);
      setVerifications((current) =>
        current.map((v) =>
          v.id === id ? { ...v, status: "pending", submitted_at: new Date().toISOString() } : v,
        ),
      );
      // Clear upload success indicator once submitted
      setUploadedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de soumettre. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <p
          className="rounded-lg px-4 py-3 text-sm"
          style={{ backgroundColor: "rgba(255,68,68,0.13)", color: "var(--color-danger)" }}
          role="alert"
        >
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" disabled={loading} onClick={() => create("identity")}>
          Identité
        </Button>
        <Button size="sm" variant="outline" disabled={loading} onClick={() => create("artist")}>
          Artiste
        </Button>
        <Button size="sm" variant="outline" disabled={loading} onClick={() => create("label")}>
          Label
        </Button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file || !activeId) return;
          const targetId = activeId;
          setLoading(true);
          setError(null);
          try {
            await uploadDoc(targetId, file);
            setUploadedIds((prev) => new Set(prev).add(targetId));
            router.refresh();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Échec de l'envoi du document.");
          } finally {
            setLoading(false);
            setActiveId(null);
          }
          event.target.value = "";
        }}
      />

      {verifications.length === 0 ? (
        <Card>
          <CardContent className="text-texte-secondaire py-8 text-center text-sm">
            Aucune demande de vérification. Créez-en une ci-dessus.
          </CardContent>
        </Card>
      ) : (
        verifications.map((v) => (
          <Card key={v.id}>
            <CardContent className="space-y-3 py-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{VERIFICATION_TYPE_LABELS[v.verification_type]}</Badge>
                <Badge variant="primary">{VERIFICATION_STATUS_LABELS[v.status]}</Badge>
              </div>
              {v.rejection_reason ? (
                <p className="text-rouge-alerte text-sm">{v.rejection_reason}</p>
              ) : null}

              {/* Feedback succès upload */}
              {uploadedIds.has(v.id) && (
                <p className="text-sm font-medium" style={{ color: "var(--color-vert-energie)" }}>
                  ✓ Document joint. Vous pouvez maintenant soumettre.
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                {v.status === "draft" || v.status === "rejected" ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setActiveId(v.id);
                        fileRef.current?.click();
                      }}
                    >
                      {uploadedIds.has(v.id) ? "Remplacer document" : "Joindre document"}
                    </Button>
                    <Button
                      size="sm"
                      disabled={loading || (!v.document_path && !uploadedIds.has(v.id))}
                      onClick={() => submit(v.id)}
                    >
                      {loading ? "Envoi…" : "Soumettre"}
                    </Button>
                  </>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
