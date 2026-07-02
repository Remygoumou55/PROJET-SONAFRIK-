import { PublishHome } from "@/features/creator/catalog/components/PublishHome";
import { requireCreatorContext } from "@/features/creator/lib/requireCreator";

export default async function CatalogTracksPage() {
  const creator = await requireCreatorContext();
  const stageName = creator.artistProfile.stage_name ?? "";
  return (
    <PublishHome
      creatorId={creator.creator.id}
      stageName={stageName}
    />
  );
}
