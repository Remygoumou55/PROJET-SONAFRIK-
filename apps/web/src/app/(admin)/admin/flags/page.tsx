import { requireAdmin } from "@/features/admin/lib/requireAdmin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { AdminFlagsCenter } from "@/features/admin/components/AdminFlagsCenter";
import { createAdminService } from "@sonafrik/api/admin";

export const metadata = { title: "Feature Flags — Admin SONAFRIK" };

export default async function AdminFlagsPage() {
  await requireAdmin();
  const supabase = await getSupabaseServerClient();
  const service = createAdminService(supabase);
  const flags = await service.listFeatureFlags().catch(() => []);

  return <AdminFlagsCenter flags={flags} />;
}
