import nextDynamic from "next/dynamic";
import { createPayoutService } from "@sonafrik/api/payout";
import { AdminPageFrame } from "@/features/admin/components/AdminPageFrame";
import { AdminPageSkeleton } from "@/features/admin/components/AdminPageSkeleton";
import { getAdminServiceForSession } from "@/features/admin/lib/getAdminService";
import { getSupabaseServerClient, getSupabaseAdminClient } from "@/lib/supabase/server";
import { isDevBypassActive } from "@/lib/auth/guards";

const AdminWithdrawalsClient = nextDynamic(
  () =>
    import("@/features/admin/components/AdminWithdrawalsClient").then((m) => ({
      default: m.AdminWithdrawalsClient,
    })),
  { loading: () => <AdminPageSkeleton variant="list" /> },
);

export const dynamic = "force-dynamic";
export const metadata = { title: "Retraits — Admin SONAFRIK" };

const PAGE_LIMIT = 30;

type QueueFilter = "pending" | "approved" | "processing" | "completed" | "cancelled" | "all";

interface AdminWithdrawalsPageProps {
  searchParams: Promise<{
    filter?: string;
    page?: string;
  }>;
}

function parseFilter(value?: string): QueueFilter {
  const allowed: QueueFilter[] = [
    "pending",
    "approved",
    "processing",
    "completed",
    "cancelled",
    "all",
  ];
  if (value && allowed.includes(value as QueueFilter)) {
    return value as QueueFilter;
  }
  return "pending";
}

export default async function AdminWithdrawalsPage({ searchParams }: AdminWithdrawalsPageProps) {
  const params = await searchParams;
  const filter = parseFilter(params.filter);
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  const admin = await getAdminServiceForSession();
  const supabase = isDevBypassActive()
    ? getSupabaseAdminClient({ adminVerified: true })
    : await getSupabaseServerClient();
  const payout = createPayoutService(supabase);

  const [meta, queue] = await Promise.all([
    admin.getWithdrawalsDashboardMeta(filter, page, PAGE_LIMIT),
    payout.getAdminPayoutQueue({ status: filter, limit: 200 }).catch(() => []),
  ]);

  const start = (page - 1) * PAGE_LIMIT;
  const pageWithdrawals = queue.slice(start, start + PAGE_LIMIT);
  const userIds = pageWithdrawals.map((entry) => entry.user_id);
  const walletBalances = await admin.getWalletBalancesByUserIds(userIds).catch(() => ({}));

  return (
    <AdminPageFrame>
      <AdminWithdrawalsClient
        {...meta}
        withdrawals={pageWithdrawals}
        walletBalances={walletBalances}
      />
    </AdminPageFrame>
  );
}
