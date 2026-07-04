import { PublicationWizardPage } from "@/features/creator/catalog/components/PublicationWizardPage";
import { requireCreatorContext } from "@/features/creator/lib/requireCreator";

export default async function CatalogPublishPage() {
  const creator = await requireCreatorContext();
  const stageName = creator.artistProfile.stage_name ?? "";
  return (
    <PublicationWizardPage
      creatorId={creator.creator.id}
      stageName={stageName}
    />
  );
}
