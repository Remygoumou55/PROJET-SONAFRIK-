import { createCreatorService } from "@sonafrik/api/creator";
import { VerificationPanel } from "@/features/creator/components/VerificationPanel";
import { requireCreatorContext } from "@/features/creator/lib/requireCreator";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function CreatorVerificationPage() {
  const context = await requireCreatorContext();
  const supabase = await getSupabaseServerClient();
  const creator = createCreatorService(supabase);
  const verifications = await creator.getVerifications();
  return <VerificationPanel creator={context.creator} verifications={verifications} />;
}
