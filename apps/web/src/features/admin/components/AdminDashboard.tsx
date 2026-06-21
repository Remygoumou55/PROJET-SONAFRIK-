import Link from "next/link";

interface KpiCard {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
  href?: string;
}

function KpiTile({ label, value, sub, accent = "var(--color-texte-principal)", href }: KpiCard) {
  const content = (
    <div
      className="rounded-2xl p-5 flex flex-col gap-1"
      style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-elevated)" }}
    >
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-texte-desactive)" }}>
        {label}
      </p>
      <p className="text-3xl font-black tabular-nums" style={{ color: accent }}>
        {value}
      </p>
      {sub && <p className="text-xs" style={{ color: "var(--color-texte-secondaire)" }}>{sub}</p>}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block transition-opacity hover:opacity-80">
        {content}
      </Link>
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
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-texte-principal)" }}>Dashboard</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--color-texte-desactive)" }}>
          Vue globale en temps réel de la plateforme SONAFRIK
        </p>
      </div>

      {/* Section utilisateurs */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--color-texte-desactive)" }}>
          Utilisateurs
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiTile label="Total inscrits" value={kpis.totalUsers.toLocaleString("fr-FR")} />
          <KpiTile
            label="Premium actifs"
            value={kpis.premiumUsers.toLocaleString("fr-FR")}
            sub={`${kpis.totalUsers > 0 ? ((kpis.premiumUsers / kpis.totalUsers) * 100).toFixed(1) : 0}% de la base`}
            accent="var(--color-or-solaire)"
          />
        </div>
      </section>

      {/* Section streaming */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--color-texte-desactive)" }}>
          Streaming
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiTile label="Streams aujourd'hui" value={kpis.streamsToday.toLocaleString("fr-FR")} accent="var(--color-vert-energie)" />
          <KpiTile label="Streams total" value={kpis.streamsTotal.toLocaleString("fr-FR")} />
          <KpiTile
            label="Sessions fraude"
            value={kpis.fraudSessions.toLocaleString("fr-FR")}
            sub="fraud_flags non vides"
            accent={kpis.fraudSessions > 0 ? "var(--color-erreur)" : "var(--color-texte-desactive)"}
            href={kpis.fraudSessions > 0 ? "/admin/fraud" : undefined}
          />
        </div>
      </section>

      {/* Section actions en attente */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--color-texte-desactive)" }}>
          En attente d&apos;action
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiTile
            label="Soumissions catalogue"
            value={kpis.pendingCatalog}
            sub="Albums + morceaux"
            accent={kpis.pendingCatalog > 0 ? "var(--color-or-solaire)" : "var(--color-texte-desactive)"}
            href="/admin/catalog"
          />
          <KpiTile
            label="Retraits en attente"
            value={kpis.pendingWithdrawals}
            accent={kpis.pendingWithdrawals > 0 ? "var(--color-or-solaire)" : "var(--color-texte-desactive)"}
            href="/admin/finance"
          />
        </div>
      </section>

      {/* Lancement CDC Règle #7 */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--color-texte-desactive)" }}>
          Objectif de lancement — CDC Règle #7
        </h2>
        <div
          className="rounded-2xl p-5"
          style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-elevated)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-3xl font-black tabular-nums" style={{ color: "var(--color-vert-energie)" }}>
                {kpis.launchCurrent.toLocaleString("fr-FR")}
              </span>
              <span className="text-lg ml-1" style={{ color: "var(--color-texte-desactive)" }}>
                /{kpis.launchTarget.toLocaleString("fr-FR")}
              </span>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black" style={{ color: kpis.launchCurrent >= kpis.launchTarget ? "var(--color-vert-energie)" : "var(--color-or-solaire)" }}>
                {Math.min(((kpis.launchCurrent / Math.max(kpis.launchTarget, 1)) * 100), 100).toFixed(1)}%
              </p>
              <p className="text-xs" style={{ color: "var(--color-texte-desactive)" }}>abonnés payants actifs</p>
            </div>
          </div>
          <div
            className="h-2.5 w-full overflow-hidden rounded-full"
            style={{ backgroundColor: "var(--color-noir-profond)", border: "1px solid var(--color-bordure)" }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min((kpis.launchCurrent / Math.max(kpis.launchTarget, 1)) * 100, 100)}%`,
                backgroundColor: kpis.launchCurrent >= kpis.launchTarget ? "var(--color-vert-energie)" : "var(--color-or-solaire)",
                transition: "width 0.6s ease",
              }}
            />
          </div>
          {kpis.launchCurrent >= kpis.launchTarget ? (
            <p className="mt-2 text-xs font-semibold" style={{ color: "var(--color-vert-energie)" }}>
              🚀 Objectif atteint — lancement autorisé
            </p>
          ) : (
            <p className="mt-2 text-xs" style={{ color: "var(--color-texte-desactive)" }}>
              {(kpis.launchTarget - kpis.launchCurrent).toLocaleString("fr-FR")} abonnés payants manquants
            </p>
          )}
        </div>
      </section>

      {/* Liens rapides */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--color-texte-desactive)" }}>
          Navigation rapide
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { href: "/admin/catalog", label: "Revue Catalogue", desc: "Approuver / rejeter les soumissions pending_review" },
            { href: "/admin/finance", label: "Finances", desc: "File de retraits artistes à valider" },
            { href: "/admin/fraud", label: "Fraude", desc: "Sessions avec flags anti-fraude levés" },
          ].map(({ href, label, desc }) => (
            <Link
              key={href}
              href={href}
              className="rounded-xl p-4 transition-opacity hover:opacity-90 block"
              style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-elevated)" }}
            >
              <p className="text-sm font-semibold mb-1" style={{ color: "var(--color-texte-principal)" }}>
                {label}
                <span className="ml-1 text-xs font-normal" style={{ color: "var(--color-texte-desactive)" }}>→</span>
              </p>
              <p className="text-xs" style={{ color: "var(--color-texte-secondaire)" }}>{desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
