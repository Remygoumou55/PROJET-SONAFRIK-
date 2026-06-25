import type { CreatorRevenueStats } from "@sonafrik/types";
import { Card, CardContent, CardHeader, CardTitle } from "@sonafrik/ui";
import { formatGnf } from "@sonafrik/shared";

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

export function RevenueCard({ stats }: { stats: CreatorRevenueStats }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Vos revenus</CardTitle>
      </CardHeader>
      <CardContent className="divide-bordure divide-y">
        <Row
          label="Solde du portefeuille"
          value={formatGnf(stats.wallet_balance_gnf)}
          accent
        />
        <Row
          label="Revenus versés"
          value={formatGnf(stats.paid_royalties_gnf)}
          sub="Cycles déjà distribués"
        />
        <Row
          label="Revenus en attente"
          value={formatGnf(stats.pending_royalties_gnf)}
          sub="En cours de calcul"
        />
        <Row
          label="Total crédité"
          value={formatGnf(stats.total_credited_gnf)}
          sub="Toutes sources confondues"
        />
        <Row
          label="Écoutes comptabilisées"
          value={stats.valid_listen_count.toLocaleString("fr-FR")}
        />
        <Row
          label="Moyenne par écoute"
          value={
            stats.avg_gnf_per_listen > 0
              ? `${stats.avg_gnf_per_listen.toFixed(4)} GNF`
              : "—"
          }
          sub="Basé sur l'historique versé"
        />
        <Row
          label="Écoutes comptabilisées (30 jours)"
          value={stats.month_valid_streams.toLocaleString("fr-FR")}
        />
        <Row
          label="Estimation mensuelle"
          value={
            stats.estimated_monthly_gnf > 0
              ? formatGnf(stats.estimated_monthly_gnf)
              : "—"
          }
          sub={
            stats.estimated_monthly_gnf === 0
              ? "Disponible après votre premier cycle de revenus"
              : "Basée sur votre rythme actuel"
          }
          accent={stats.estimated_monthly_gnf > 0}
        />
      </CardContent>
    </Card>
  );
}
