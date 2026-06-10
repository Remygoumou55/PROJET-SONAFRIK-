import { CreatorDashboard } from "@/features/creator/components/CreatorDashboard";
import { requireCreatorContext } from "@/features/creator/lib/requireCreator";

export default async function CreatorDashboardPage() {
  const context = await requireCreatorContext();
  return <CreatorDashboard context={context} />;
}
