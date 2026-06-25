import { requireAdmin } from "@/features/admin/lib/requireAdmin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { createPayoutService } from "@sonafrik/api/payout";
import { AdminFinanceCenter } from "@/features/admin/components/AdminFinanceCenter";
import { createAdminService } from "@sonafrik/api/admin";

export const metadata = { title: "Finances — Admin SONAFRIK" };

export default async function AdminFinancePage() {
  await requireAdmin();
  const supabase = await getSupabaseServerClient();
  const payout = createPayoutService(supabase);
  const admin = createAdminService(supabase);
  const [initialQueue, initialCycles] = await Promise.all([
    payout.getAdminPayoutQueue({ status: "pending", limit: 100 }).catch(() => []),
    admin.listRoyaltyCycles(12).catch(() => []),
  ]);

  return <AdminFinanceCenter initialQueue={initialQueue} initialRoyaltyCycles={initialCycles} />;
}
