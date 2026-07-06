import { ArtistIdentityForm } from "@/features/creator/components/ArtistIdentityForm";
import { requireCreatorContext } from "@/features/creator/lib/requireCreator";

export default async function CreatorIdentityPage() {
  const context = await requireCreatorContext();
  return (
    <ArtistIdentityForm
      profile={context.artistProfile}
      creatorId={context.creator.id}
      userId={context.creator.owner_id}
    />
  );
}
