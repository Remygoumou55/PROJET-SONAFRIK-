import { createCatalogService } from "@sonafrik/api/catalog";
import { CatalogDashboard } from "@/features/creator/catalog/components/CatalogDashboard";
import { requireCreatorContext } from "@/features/creator/lib/requireCreator";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function CatalogDashboardPage() {
  await requireCreatorContext();
  const supabase = await getSupabaseServerClient();
  const catalog = createCatalogService(supabase);
  const context = await catalog.getCatalogContext();
  return <CatalogDashboard context={context} />;
}
