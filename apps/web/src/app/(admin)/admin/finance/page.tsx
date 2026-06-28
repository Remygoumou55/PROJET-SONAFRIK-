import { getAdminServiceForSession } from "@/features/admin/lib/getAdminService";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { createPayoutService } from "@sonafrik/api/payout";
import { AdminPageFrame } from "@/features/admin/components/AdminPageFrame";
import { AdminFinanceCenter } from "@/features/admin/components/AdminFinanceCenter";

export const metadata = { title: "Revenus — Admin SONAFRIK" };

export default async function AdminFinancePage() {
  const admin = await getAdminServiceForSession();
  const supabase = await getSupabaseServerClient();
  const payout = createPayoutService(supabase);
  const [initialQueue, initialCycles, initialBatches] = await Promise.all([
    payout.getAdminPayoutQueue({ status: "pending", limit: 100 }).catch(() => []),
    admin.listRoyaltyCycles(12).catch(() => []),
    payout.listPayoutBatches(20).catch(() => []),
  ]);

  return (
    <AdminPageFrame title="Revenus" subtitle="Retraits, royalties et batches de payout">
      <AdminFinanceCenter
        initialQueue={initialQueue}
        initialRoyaltyCycles={initialCycles}
        initialBatches={initialBatches}
      />
    </AdminPageFrame>
  );
}
