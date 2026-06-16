"use client";

interface KpiCard {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
  href?: string;
}

function KpiTile({ label, value, sub, accent = "#FFFFFF", href }: KpiCard) {
  const content = (
    <div
      className="rounded-2xl p-5 flex flex-col gap-1"
      style={{ backgroundColor: "#1F1F1F", border: "1px solid #2A2A2A" }}
    >
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#555555" }}>
        {label}
      </p>
      <p className="text-3xl font-black tabular-nums" style={{ color: accent }}>
        {value}
      </p>
      {sub && <p className="text-xs" style={{ color: "#A0A0A0" }}>{sub}</p>}
    </div>
  );

  if (href) {
    return (
      <a href={href} className="block transition-opacity hover:opacity-80">
        {content}
      </a>
    );
  }
  return content;
}

interface Props {
  kpis: {
    totalUsers: number;
    premiumUsers: number;
    streamsToday: number;
    streamsTotal: number;
    pendingCatalog: number;
    pendingWithdrawals: number;
    fraudSessions: number;
    launchCurrent: number;
    launchTarget: number;
  };
}

export function AdminDashboard({ kpis }: Props) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#FFFFFF" }}>Dashboard</h1>
        <p className="mt-1 text-sm" style={{ color: "#555555" }}>
          Vue globale en temps réel de la plateforme SONAFRIK
        </p>
      </div>

      {/* Section utilisateurs */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#555555" }}>
          Utilisateurs
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiTile label="Total inscrits" value={kpis.totalUsers.toLocaleString("fr-FR")} />
          <KpiTile
            label="Premium actifs"
            value={kpis.premiumUsers.toLocaleString("fr-FR")}
            sub={`${kpis.totalUsers > 0 ? ((kpis.premiumUsers / kpis.totalUsers) * 100).toFixed(1) : 0}% de la base`}
            accent="#FFC20E"
          />
        </div>
      </section>

      {/* Section streaming */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#555555" }}>
          Streaming
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiTile label="Streams aujourd'hui" value={kpis.streamsToday.toLocaleString("fr-FR")} accent="#00D26A" />
          <KpiTile label="Streams total" value={kpis.streamsTotal.toLocaleString("fr-FR")} />
          <KpiTile
            label="Sessions fraude"
            value={kpis.fraudSessions.toLocaleString("fr-FR")}
            sub="fraud_flags non vides"
            accent={kpis.fraudSessions > 0 ? "#FF6666" : "#555555"}
            href={kpis.fraudSessions > 0 ? "/admin/fraud" : undefined}
          />
        </div>
      </section>

      {/* Section actions en attente */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#555555" }}>
          En attente d&apos;action
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiTile
            label="Soumissions catalogue"
            value={kpis.pendingCatalog}
            sub="Albums + morceaux"
            accent={kpis.pendingCatalog > 0 ? "#FFC20E" : "#555555"}
            href="/admin/catalog"
          />
          <KpiTile
            label="Retraits en attente"
            value={kpis.pendingWithdrawals}
            accent={kpis.pendingWithdrawals > 0 ? "#FFC20E" : "#555555"}
            href="/admin/finance"
          />
        </div>
      </section>

      {/* Lancement CDC Règle #7 */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#555555" }}>
          Objectif de lancement — CDC Règle #7
        </h2>
        <div
          className="rounded-2xl p-5"
          style={{ backgroundColor: "#1F1F1F", border: "1px solid #2A2A2A" }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-3xl font-black tabular-nums" style={{ color: "#00CC44" }}>
                {kpis.launchCurrent.toLocaleString("fr-FR")}
              </span>
              <span className="text-lg ml-1" style={{ color: "#444444" }}>
                /{kpis.launchTarget.toLocaleString("fr-FR")}
              </span>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black" style={{ color: kpis.launchCurrent >= kpis.launchTarget ? "#00CC44" : "#FFC20E" }}>
                {Math.min(((kpis.launchCurrent / Math.max(kpis.launchTarget, 1)) * 100), 100).toFixed(1)}%
              </p>
              <p className="text-xs" style={{ color: "#555555" }}>abonnés payants actifs</p>
            </div>
          </div>
          <div
            className="h-2.5 w-full overflow-hidden rounded-full"
            style={{ backgroundColor: "#0D0D0D", border: "1px solid #333333" }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min((kpis.launchCurrent / Math.max(kpis.launchTarget, 1)) * 100, 100)}%`,
                backgroundColor: kpis.launchCurrent >= kpis.launchTarget ? "#00CC44" : "#FFC20E",
                transition: "width 0.6s ease",
              }}
            />
          </div>
          {kpis.launchCurrent >= kpis.launchTarget ? (
            <p className="mt-2 text-xs font-semibold" style={{ color: "#00CC44" }}>
              🚀 Objectif atteint — lancement autorisé
            </p>
          ) : (
            <p className="mt-2 text-xs" style={{ color: "#555555" }}>
              {(kpis.launchTarget - kpis.launchCurrent).toLocaleString("fr-FR")} abonnés payants manquants
            </p>
          )}
        </div>
      </section>

      {/* Liens rapides */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#555555" }}>
          Navigation rapide
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { href: "/admin/catalog", label: "Revue Catalogue", desc: "Approuver / rejeter les soumissions pending_review" },
            { href: "/admin/finance", label: "Finances", desc: "File de retraits artistes à valider" },
            { href: "/admin/fraud", label: "Fraude", desc: "Sessions avec flags anti-fraude levés" },
          ].map(({ href, label, desc }) => (
            <a
              key={href}
              href={href}
              className="rounded-xl p-4 transition-colors group"
              style={{ backgroundColor: "#1F1F1F", border: "1px solid #2A2A2A" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "#FFC20E44")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "#2A2A2A")}
            >
              <p className="text-sm font-semibold mb-1" style={{ color: "#FFFFFF" }}>
                {label}
                <span className="ml-1 text-xs font-normal" style={{ color: "#555555" }}>→</span>
              </p>
              <p className="text-xs" style={{ color: "#A0A0A0" }}>{desc}</p>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
