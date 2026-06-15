import { requireAdmin } from "@/features/admin/lib/requireAdmin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { AdminFraudCenter } from "@/features/admin/components/AdminFraudCenter";

export const metadata = { title: "Fraude — Admin SONAFRIK" };

export default async function AdminFraudPage() {
  await requireAdmin();
  const supabase = await getSupabaseServerClient();

  const { data } = await supabase
    .from("stream_sessions")
    .select("id, user_id, track_id, platform, started_at, total_listened_seconds, total_duration_seconds, listen_percentage, fraud_flags, is_valid_listen, ip_address")
    .filter("fraud_flags", "neq", "{}")
    .order("started_at", { ascending: false })
    .limit(200);

  type FraudRow = Parameters<typeof AdminFraudCenter>[0]["sessions"][number];
  return (
    <AdminFraudCenter sessions={(data ?? []) as FraudRow[]} />
  );
}
