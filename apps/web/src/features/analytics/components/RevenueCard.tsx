import type { CreatorRevenueStats } from "@sonafrik/types";
import { Card, CardContent, CardHeader, CardTitle } from "@sonafrik/ui";

function Row({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-start justify-between py-2">
      <div>
        <span className="text-texte-secondaire text-sm">{label}</span>
        {sub && <p className="text-texte-desactive text-xs">{sub}</p>}
      </div>
      <span
        className={`text-sm font-semibold ${accent ? "text-vert-energie" : "text-texte-principal"}`}
      >
        {value}
      </span>
    </div>
  );
}

function fmtGnf(n: number): string {
  if (n === 0) return "0 GNF";
  return `${n.toLocaleString("fr-FR")} GNF`;
}

export function RevenueCard({ stats }: { stats: CreatorRevenueStats }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-base">Revenus</CardTitle>
          <span className="text-texte-desactive bg-surface rounded px-2 py-0.5 text-xs">
            Fondations — Royalty Engine Sprint 8
          </span>
        </div>
      </CardHeader>
      <CardContent className="divide-bordure divide-y">
        <Row
          label="Solde wallet"
          value={fmtGnf(stats.wallet_balance_gnf)}
          accent
        />
        <Row
          label="Royalties payées"
          value={fmtGnf(stats.paid_royalties_gnf)}
          sub="Cycles distribués"
        />
        <Row
          label="Royalties en attente"
          value={fmtGnf(stats.pending_royalties_gnf)}
          sub="Cycles en cours · non encore versés"
        />
        <Row
          label="Total crédité"
          value={fmtGnf(stats.total_credited_gnf)}
          sub="Toutes sources confondues"
        />
        <Row
          label="Écoutes valides comptabilisées"
          value={stats.valid_listen_count.toLocaleString("fr-FR")}
        />
        <Row
          label="Moy. par écoute"
          value={
            stats.avg_gnf_per_listen > 0
              ? `${stats.avg_gnf_per_listen.toFixed(4)} GNF`
              : "—"
          }
          sub="Basé sur l'historique payé"
        />
        <Row
          label="Streams valides (30 derniers jours)"
          value={stats.month_valid_streams.toLocaleString("fr-FR")}
        />
        <Row
          label="Projection mensuelle estimée"
          value={
            stats.estimated_monthly_gnf > 0
              ? fmtGnf(stats.estimated_monthly_gnf)
              : "—"
          }
          sub={
            stats.estimated_monthly_gnf === 0
              ? "Disponible après le premier cycle de royalties"
              : "Estimation basée sur le rythme actuel"
          }
          accent={stats.estimated_monthly_gnf > 0}
        />
      </CardContent>
    </Card>
  );
}
