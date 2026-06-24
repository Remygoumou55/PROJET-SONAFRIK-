import { requireAdmin } from "@/features/admin/lib/requireAdmin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { createPayoutService } from "@sonafrik/api/payout";
import { AdminFinanceCenter } from "@/features/admin/components/AdminFinanceCenter";

export const metadata = { title: "Finances — Admin SONAFRIK" };

export default async function AdminFinancePage() {
  await requireAdmin();
  const supabase = await getSupabaseServerClient();
  const payout = createPayoutService(supabase);
  const initialQueue = await payout.getAdminPayoutQueue({ status: "pending", limit: 100 }).catch(() => []);

  return <AdminFinanceCenter initialQueue={initialQueue} />;
}
