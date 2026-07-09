"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { PUBLICATIONS_HREF } from "../../catalog/hooks/usePublicationPublishToast";

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

  const goToPublications = () => {
    router.push(PUBLICATIONS_HREF);
    router.refresh();
  };

  return (
    <PublicationWizard
      creatorId={creatorId}
      stageName={stageName}
      onComplete={goToPublications}
      onCancel={goToPublications}
    />
  );
}
