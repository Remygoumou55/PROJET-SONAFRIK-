"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

const PublicationWizard = dynamic(
  () => import("./PublicationWizard").then((m) => ({ default: m.PublicationWizard })),
  {
    ssr: false,
    loading: () => (
      <div className="pub-wiz pub-wiz--page-loading" aria-busy="true">
        <div className="pub-wiz__step-loading">Chargement de l&apos;assistant…</div>
      </div>
    ),
  },
);

export default function PublicationWizardPage({
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
