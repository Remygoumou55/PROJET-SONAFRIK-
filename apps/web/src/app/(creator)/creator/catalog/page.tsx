import { createCatalogService } from "@sonafrik/api/catalog";
import { CatalogDashboard } from "@/features/creator/catalog/components/CatalogDashboard";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function CatalogDashboardPage() {
  const supabase = await getSupabaseServerClient();
  const catalog = createCatalogService(supabase);
  const context = await catalog.getCatalogContext();
  return <CatalogDashboard context={context} />;
}
