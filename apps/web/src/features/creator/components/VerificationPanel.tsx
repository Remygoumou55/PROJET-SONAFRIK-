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

  async function create(type: "identity" | "artist" | "label") {
    setLoading(true);
    try {
      const v = await creatorService.createVerification({
        verificationType: type,
        documentType: type === "label" ? "business_license" : "national_id",
      });
      setVerifications((current) => [v, ...current]);
    } finally {
      setLoading(false);
    }
  }

  async function uploadDoc(verificationId: string, file: File) {
    await creatorService.requestAssetUploadUrl({
      creatorId: creator.id,
      assetKind: "verification",
      contentType: file.type as "image/jpeg" | "image/png" | "image/webp" | "application/pdf",
      verificationId,
    }).then(async ({ signedUrl, token }) => {
      await fetch(signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type, ...(token ? { "x-upsert": "true" } : {}) },
        body: file,
      });
    });
  }

  async function submit(id: string) {
    setLoading(true);
    try {
      await creatorService.submitVerification(id);
      setVerifications((current) =>
        current.map((v) =>
          v.id === id ? { ...v, status: "pending", submitted_at: new Date().toISOString() } : v,
        ),
      );
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
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
          setLoading(true);
          try {
            await uploadDoc(activeId, file);
            router.refresh();
          } finally {
            setLoading(false);
            setActiveId(null);
          }
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
                      Joindre document
                    </Button>
                    <Button size="sm" disabled={loading || !v.document_path} onClick={() => submit(v.id)}>
                      Soumettre
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
