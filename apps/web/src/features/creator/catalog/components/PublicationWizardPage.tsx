"use client";

import { useRouter } from "next/navigation";
import { PublicationWizard } from "./PublicationWizard";

export function PublicationWizardPage({
  creatorId,
  stageName,
}: {
  creatorId: string;
  stageName: string;
}) {
  const router = useRouter();
  return (
    <PublicationWizard
      creatorId={creatorId}
      stageName={stageName}
      onComplete={() => router.push("/creator/catalog/tracks")}
      onCancel={() => router.push("/creator/catalog/tracks")}
    />
  );
}
