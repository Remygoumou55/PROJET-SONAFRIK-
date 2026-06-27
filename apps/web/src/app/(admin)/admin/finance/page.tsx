import { requireAdmin } from "@/features/admin/lib/requireAdmin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { createPayoutService } from "@sonafrik/api/payout";
import { createAdminService } from "@sonafrik/api/admin";
import { AdminFinanceCenter } from "@/features/admin/components/AdminFinanceCenter";

export const metadata = { title: "Finances — Admin SONAFRIK" };

export default async function AdminFinancePage() {
  await requireAdmin();
  const supabase = await getSupabaseServerClient();
  const payout = createPayoutService(supabase);
  const admin = createAdminService(supabase);
  const [initialQueue, initialCycles, initialBatches] = await Promise.all([
    payout.getAdminPayoutQueue({ status: "pending", limit: 100 }).catch(() => []),
    admin.listRoyaltyCycles(12).catch(() => []),
    payout.listPayoutBatches(20).catch(() => []),
  ]);

  return (
    <AdminFinanceCenter
      initialQueue={initialQueue}
      initialRoyaltyCycles={initialCycles}
      initialBatches={initialBatches}
    />
  );
}
