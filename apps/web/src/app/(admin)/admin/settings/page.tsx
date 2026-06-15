import { requireAdmin } from "@/features/admin/lib/requireAdmin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { AdminSettingsCenter } from "@/features/admin/components/AdminSettingsCenter";
import { createAdminService } from "@sonafrik/api/admin";

export const metadata = { title: "Paramètres — Admin SONAFRIK" };

export default async function AdminSettingsPage() {
  await requireAdmin();
  const supabase = await getSupabaseServerClient();
  const service = createAdminService(supabase);
  const settings = await service.listSystemSettings().catch(() => []);

  return <AdminSettingsCenter settings={settings} />;
}
