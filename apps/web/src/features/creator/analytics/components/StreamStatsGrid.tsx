import type { CreatorStreamStats } from "@sonafrik/types";
import { Card, CardContent } from "@sonafrik/ui";

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-texte-desactive text-xs uppercase tracking-wider">{label}</p>
        <p
          className={`mt-1 text-2xl font-bold ${accent ? "text-vert-energie" : "text-texte-principal"}`}
        >
          {value}
        </p>
        {sub && <p className="text-texte-desactive mt-0.5 text-xs">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export function StreamStatsGrid({ stats }: { stats: CreatorStreamStats }) {
  const fmt = (n: number) => n.toLocaleString("fr-FR");

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-texte-principal text-base font-semibold">Vos écoutes</h2>
        <p className="text-texte-secondaire mt-1 text-sm">
          Comment votre musique est écoutée sur SONAFRIK.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total des écoutes"
          value={fmt(stats.total_streams)}
          sub={`${stats.valid_rate_percent} % comptabilisées`}
        />
        <StatCard
          label="Écoutes comptabilisées"
          value={fmt(stats.valid_streams)}
          accent
        />
        <StatCard
          label="Aujourd'hui"
          value={fmt(stats.today_streams)}
          sub="écoutes aujourd'hui"
        />
        <StatCard
          label="Écoutes invalides"
          value={fmt(stats.fraud_streams)}
          sub="filtrées par notre système"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="7 derniers jours"
          value={fmt(stats.week_streams)}
          sub={`dont ${fmt(stats.valid_week_streams)} comptabilisées`}
        />
        <StatCard
          label="30 derniers jours"
          value={fmt(stats.month_streams)}
          sub={`dont ${fmt(stats.valid_month_streams)} comptabilisées`}
        />
        <StatCard
          label="90 derniers jours"
          value={fmt(stats.quarter_streams)}
          sub="trimestre glissant"
        />
      </div>
    </div>
  );
}
