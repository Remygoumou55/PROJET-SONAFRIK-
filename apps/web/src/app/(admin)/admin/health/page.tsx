import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const EXPECTED_FUNCTIONS = [
  "audit-log",
  "stream-start",
  "stream-complete",
  "payment-initiate",
  "payment-orange-callback",
  "payment-mtn-callback",
  "payment-wave-callback",
  "payment-soutra-callback",
];

interface CheckResult {
  label:     string;
  ok:        boolean;
  latencyMs?: number;
  detail?:   string;
}

async function checkDatabase(): Promise<CheckResult> {
  const start = Date.now();
  try {
    const supabase = await getSupabaseServerClient();
    const { count, error } = await supabase
      .from("tracks")
      .select("*", { count: "exact", head: true });
    if (error) return { label: "Base de données", ok: false, latencyMs: Date.now() - start, detail: error.message };
    return { label: "Base de données", ok: true, latencyMs: Date.now() - start, detail: `${count ?? 0} morceaux indexés` };
  } catch (err) {
    return { label: "Base de données", ok: false, latencyMs: Date.now() - start, detail: String(err) };
  }
}

async function checkStorage(): Promise<CheckResult> {
  const start = Date.now();
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase.storage.from("covers").list("", { limit: 1 });
    if (error) return { label: "Supabase Storage", ok: false, latencyMs: Date.now() - start, detail: error.message };
    return { label: "Supabase Storage", ok: true, latencyMs: Date.now() - start, detail: `${data?.length ?? 0} fichier(s) trouvé(s) dans covers/` };
  } catch (err) {
    return { label: "Supabase Storage", ok: false, latencyMs: Date.now() - start, detail: String(err) };
  }
}

async function checkWallets(): Promise<CheckResult> {
  const start = Date.now();
  try {
    const supabase = await getSupabaseServerClient();
    const { count, error } = await supabase
      .from("wallets")
      .select("*", { count: "exact", head: true });
    if (error) return { label: "Wallets", ok: false, latencyMs: Date.now() - start, detail: error.message };
    return { label: "Wallets", ok: true, latencyMs: Date.now() - start, detail: `${count ?? 0} wallets actifs` };
  } catch (err) {
    return { label: "Wallets", ok: false, latencyMs: Date.now() - start, detail: String(err) };
  }
}

interface AdminAlert {
  id:         string;
  type:       string;
  message:    string;
  created_at: string;
}

async function fetchUnreadAlerts(): Promise<AdminAlert[]> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data } = await supabase
      .from("admin_notifications")
      .select("id, type, message, created_at")
      .eq("is_read", false)
      .order("created_at", { ascending: false })
      .limit(10);
    return (data as AdminAlert[]) ?? [];
  } catch {
    return [];
  }
}

async function checkPayments(): Promise<CheckResult> {
  const start = Date.now();
  try {
    const supabase = await getSupabaseServerClient();
    const { count, error } = await supabase
      .from("payment_intents")
      .select("*", { count: "exact", head: true })
      .eq("status", "confirmed");
    if (error) return { label: "Paiements confirmés", ok: false, latencyMs: Date.now() - start, detail: error.message };
    return { label: "Paiements confirmés", ok: true, latencyMs: Date.now() - start, detail: `${count ?? 0} total` };
  } catch (err) {
    return { label: "Paiements confirmés", ok: false, latencyMs: Date.now() - start, detail: String(err) };
  }
}

function StatusBadge({ ok }: { ok: boolean }) {
  return (
    <span
      className="text-base"
      title={ok ? "Opérationnel" : "Dégradé / Indisponible"}
    >
      {ok ? "✅" : "❌"}
    </span>
  );
}

function HealthRow({ result }: { result: CheckResult }) {
  return (
    <div
      className="flex items-center justify-between py-3 border-b"
      style={{ borderColor: "var(--color-elevated)" }}
    >
      <div className="flex items-center gap-3">
        <StatusBadge ok={result.ok} />
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--color-texte-principal)" }}>{result.label}</p>
          {result.detail && (
            <p className="text-xs" style={{ color: "var(--color-texte-desactive)" }}>{result.detail}</p>
          )}
        </div>
      </div>
      {result.latencyMs !== undefined && (
        <span
          className="text-xs font-mono tabular-nums"
          style={{ color: result.latencyMs < 200 ? "var(--color-vert-energie)" : result.latencyMs < 800 ? "var(--color-or-solaire)" : "var(--color-erreur)" }}
        >
          {result.latencyMs} ms
        </span>
      )}
    </div>
  );
}

export default async function AdminHealthPage() {
  const [db, storage, wallets, payments, alerts] = await Promise.allSettled([
    checkDatabase(),
    checkStorage(),
    checkWallets(),
    checkPayments(),
    fetchUnreadAlerts(),
  ]);

  const results: CheckResult[] = [
    db.status        === "fulfilled" ? db.value        : { label: "Base de données",   ok: false, detail: "Timeout" },
    storage.status   === "fulfilled" ? storage.value   : { label: "Supabase Storage",  ok: false, detail: "Timeout" },
    wallets.status   === "fulfilled" ? wallets.value   : { label: "Wallets",            ok: false, detail: "Timeout" },
    payments.status  === "fulfilled" ? payments.value  : { label: "Paiements",          ok: false, detail: "Timeout" },
  ];

  const unreadAlerts: AdminAlert[] = alerts.status === "fulfilled" ? alerts.value : [];
  const allOk = results.every((r) => r.ok);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--color-texte-principal)" }}>Santé du système</h1>
          <p className="text-xs mt-1" style={{ color: "var(--color-texte-desactive)" }}>
            Généré le {new Date().toLocaleString("fr-GN", { timeZone: "Africa/Conakry" })} (Conakry)
          </p>
        </div>
        <span
          className="px-3 py-1.5 rounded-lg text-xs font-bold"
          style={{
            backgroundColor: allOk ? "#00D26A22" : "#FF666622",
            color:           allOk ? "var(--color-vert-energie)"   : "var(--color-erreur)",
            border:          `1px solid ${allOk ? "#00D26A44" : "#FF666644"}`,
          }}
        >
          {allOk ? "TOUT OPÉRATIONNEL" : "DÉGRADÉ"}
        </span>
      </div>

      {/* Composants infrastructure */}
      <div
        className="rounded-2xl p-5"
        style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-elevated)" }}
      >
        <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--color-texte-secondaire)" }}>Infrastructure</h2>
        {results.map((r) => <HealthRow key={r.label} result={r} />)}
      </div>

      {/* Alertes admin — générées par trigger check_provider_failure_rate */}
      <div
        className="rounded-2xl p-5"
        style={{ backgroundColor: "var(--color-surface)", border: `1px solid ${unreadAlerts.length > 0 ? "#FFC20E44" : "var(--color-elevated)"}` }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold" style={{ color: "var(--color-texte-secondaire)" }}>Alertes système</h2>
          {unreadAlerts.length > 0 && (
            <span
              className="px-2 py-0.5 rounded-full text-xs font-bold"
              style={{ backgroundColor: "#FFC20E22", color: "var(--color-or-solaire)" }}
            >
              {unreadAlerts.length} non lue{unreadAlerts.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
        {unreadAlerts.length === 0 ? (
          <p className="text-xs" style={{ color: "var(--color-texte-desactive)" }}>✅ Aucune alerte active.</p>
        ) : (
          <div className="space-y-2">
            {unreadAlerts.map((alert) => (
              <div
                key={alert.id}
                className="rounded-lg px-3 py-2.5"
                style={{ backgroundColor: "var(--color-elevated)", border: "1px solid #FFC20E33" }}
              >
                <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--color-or-solaire)" }}>
                  ⚠️ {alert.type.replace(/_/g, " ")}
                </p>
                <p className="text-xs" style={{ color: "var(--color-texte-secondaire)" }}>{alert.message}</p>
                <p className="text-xs mt-1 font-mono" style={{ color: "var(--color-texte-desactive)" }}>
                  {new Date(alert.created_at).toLocaleString("fr-GN", { timeZone: "Africa/Conakry" })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edge Functions attendues */}
      <div
        className="rounded-2xl p-5"
        style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-elevated)" }}
      >
        <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--color-texte-secondaire)" }}>Edge Functions (à vérifier manuellement)</h2>
        <p className="text-xs mb-3" style={{ color: "var(--color-texte-desactive)" }}>
          L&apos;état des Edge Functions n&apos;est pas vérifiable depuis le serveur Next.js.<br />
          Vérifiez dans Supabase Dashboard → Edge Functions.
        </p>
        <div className="space-y-2">
          {EXPECTED_FUNCTIONS.map((fn) => (
            <div key={fn} className="flex items-center gap-2">
              <span className="text-sm">⚠️</span>
              <code className="text-xs font-mono" style={{ color: "var(--color-texte-secondaire)" }}>{fn}</code>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
