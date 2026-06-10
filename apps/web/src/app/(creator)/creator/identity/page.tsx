import { ArtistIdentityForm } from "@/features/creator/components/ArtistIdentityForm";
import { requireCreatorContext } from "@/features/creator/lib/requireCreator";

export default async function CreatorIdentityPage() {
  const context = await requireCreatorContext();
  return <ArtistIdentityForm creator={context.creator} profile={context.artistProfile} />;
}
