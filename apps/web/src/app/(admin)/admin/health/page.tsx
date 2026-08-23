import { getAdminServiceForSession } from "@/features/admin/lib/getAdminService";
import { AdminPageFrame } from "@/features/admin/components/AdminPageFrame";

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

function StatusBadge({ ok }: { ok: boolean }) {
  return (
    <span className="text-base" title={ok ? "Opérationnel" : "Dégradé / Indisponible"}>
      {ok ? "✅" : "❌"}
    </span>
  );
}

function HealthRow({ result }: { result: { label: string; ok: boolean; latencyMs?: number; detail?: string } }) {
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
          style={{
            color:
              result.latencyMs < 200
                ? "var(--color-vert-energie)"
                : result.latencyMs < 800
                  ? "var(--color-or-solaire)"
                  : "var(--color-erreur)",
          }}
        >
          {result.latencyMs} ms
        </span>
      )}
    </div>
  );
}

export default async function AdminHealthPage() {
  const admin = await getAdminServiceForSession();
  const { checks, alerts: unreadAlerts } = await admin.getHealthSnapshot();
  const allOk = checks.every((r) => r.ok);

  return (
    <AdminPageFrame
      title="Santé système"
      subtitle={`Généré le ${new Date().toLocaleString("fr-GN", { timeZone: "Africa/Conakry" })} (Conakry)`}
    >
      <div className="flex items-center justify-end mb-4">
        <span
          className="px-3 py-1.5 rounded-lg text-xs font-bold"
          style={{
            backgroundColor: allOk ? "rgba(200, 75, 255, 0.13)" : "rgba(255, 102, 102, 0.13)",
            color: allOk ? "var(--color-vert-energie)" : "var(--color-erreur)",
            border: `1px solid ${allOk ? "rgba(200, 75, 255, 0.27)" : "rgba(255, 102, 102, 0.27)"}`,
          }}
        >
          {allOk ? "TOUT OPÉRATIONNEL" : "DÉGRADÉ"}
        </span>
      </div>

      <div className="space-y-6">
      <div
        className="rounded-2xl p-5"
        style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-elevated)" }}
      >
        <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--color-texte-secondaire)" }}>Infrastructure</h2>
        {checks.map((r) => <HealthRow key={r.label} result={r} />)}
      </div>

      <div
        className="rounded-2xl p-5"
        style={{
          backgroundColor: "var(--color-surface)",
          border: `1px solid ${unreadAlerts.length > 0 ? "rgba(69, 230, 255, 0.27)" : "var(--color-elevated)"}`,
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold" style={{ color: "var(--color-texte-secondaire)" }}>Alertes système</h2>
          {unreadAlerts.length > 0 && (
            <span
              className="px-2 py-0.5 rounded-full text-xs font-bold"
              style={{ backgroundColor: "rgba(69, 230, 255, 0.13)", color: "var(--color-or-solaire)" }}
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
                style={{ backgroundColor: "var(--color-elevated)", border: "1px solid rgba(69, 230, 255, 0.20)" }}
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

      <div
        className="rounded-2xl p-5"
        style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-elevated)" }}
      >
        <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--color-texte-secondaire)" }}>
          Edge Functions (à vérifier manuellement)
        </h2>
        <p className="text-xs mb-3" style={{ color: "var(--color-texte-desactive)" }}>
          L&apos;état des Edge Functions n&apos;est pas vérifiable depuis le serveur Next.js.
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
    </AdminPageFrame>
  );
}
