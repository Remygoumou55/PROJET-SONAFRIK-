import { requireAdmin } from "@/features/admin/lib/requireAdmin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { AdminDashboard } from "@/features/admin/components/AdminDashboard";

export const metadata = { title: "Dashboard Admin — SONAFRIK" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();
  const supabase = await getSupabaseServerClient();

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0); // UTC pour cohérence avec Supabase (timezone serveur Vercel variable)
  const nowIso = new Date().toISOString();

  const c = (q: PromiseLike<{ count: number | null; error: unknown }>) =>
    Promise.resolve(q).then((r) => r.count ?? 0).catch(() => 0);

  const [
    totalUsers,
    premiumUsers,
    streamsToday,
    streamsTotal,
    pendingAlbums,
    pendingTracks,
    fraudSessions,
    pendingWithdrawals,
  ] = await Promise.all([
    c(supabase.from("profiles").select("*", { count: "exact", head: true }).is("deleted_at", null)),
    c(supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_premium", true).gt("premium_expires_at", nowIso)),
    c(supabase.from("stream_sessions").select("*", { count: "exact", head: true }).gte("started_at", today.toISOString())),
    c(supabase.from("stream_sessions").select("*", { count: "exact", head: true })),
    c(supabase.from("albums").select("*", { count: "exact", head: true }).eq("publication_status", "pending_review").is("deleted_at", null)),
    c(supabase.from("tracks").select("*", { count: "exact", head: true }).eq("publication_status", "pending_review").is("deleted_at", null)),
    c(supabase.from("stream_sessions").select("*", { count: "exact", head: true }).filter("fraud_flags", "neq", "{}")),
    c(supabase.from("withdrawals").select("*", { count: "exact", head: true }).eq("status", "pending")),
  ]);

  // Compteur pré-lancement (CDC Règle #7)
  let launchCurrent = 0;
  let launchTarget  = 2000;
  try {
    const { data: launchData } = await supabase.rpc("get_launch_progress");
    const lp = launchData as { current: number; target: number } | null;
    if (lp) { launchCurrent = Number(lp.current); launchTarget = Number(lp.target); }
  } catch { /* ignore */ }

  return (
    <AdminDashboard
      kpis={{
        totalUsers:        totalUsers         ?? 0,
        premiumUsers:      premiumUsers        ?? 0,
        streamsToday:      streamsToday        ?? 0,
        streamsTotal:      streamsTotal        ?? 0,
        pendingCatalog:    (pendingAlbums ?? 0) + (pendingTracks ?? 0),
        pendingWithdrawals:pendingWithdrawals  ?? 0,
        fraudSessions:     fraudSessions       ?? 0,
        launchCurrent,
        launchTarget,
      }}
    />
  );
}
