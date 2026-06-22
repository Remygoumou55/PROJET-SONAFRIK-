import type { CreatorRoyaltyHistoryEntry } from "@sonafrik/types";
import { Card, CardContent, CardHeader, CardTitle } from "@sonafrik/ui";
import { formatGnf } from "@sonafrik/shared";
import { formatMonthYear } from "@/lib/formatters";

const CALC_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:  { label: "En attente",  color: "text-or-solaire" },
  approved: { label: "Approuvé",    color: "text-blue-400"   },
  paid:     { label: "Versé",       color: "text-vert-energie" },
  cancelled:{ label: "Annulé",      color: "text-texte-desactive" },
};

function fmtGnf(n: number): string {
  return n > 0 ? formatGnf(n) : "—";
}

export function RoyaltyHistoryCard({
  history,
}: {
  history: CreatorRoyaltyHistoryEntry[];
}) {
  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historique des royalties</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-texte-desactive text-sm">
            Aucune royaltie. Vos streams valides seront comptabilisés au prochain cycle mensuel.
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalPaid = history
    .filter((h) => h.calc_status === "paid")
    .reduce((s, h) => s + h.net_amount_gnf, 0);

  const totalPending = history
    .filter((h) => h.calc_status !== "paid" && h.calc_status !== "cancelled")
    .reduce((s, h) => s + h.net_amount_gnf, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-base">Historique des royalties</CardTitle>
          <div className="text-right">
            <p className="text-vert-energie text-sm font-bold">{fmtGnf(totalPaid)}</p>
            <p className="text-texte-desactive text-xs">versé · {fmtGnf(totalPending)} en attente</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-bordure divide-y">
          {history.map((entry) => {
            const st = CALC_STATUS_LABELS[entry.calc_status] ?? CALC_STATUS_LABELS["pending"]!;
            return (
              <div
                key={entry.calculation_id}
                className="hover:bg-elevated flex items-center justify-between px-6 py-3 transition-colors"
              >
                <div>
                  <p className="text-texte-principal text-sm font-medium">
                    {formatMonthYear(entry.cycle_start)} – {formatMonthYear(entry.cycle_end)}
                  </p>
                  <p className="text-texte-desactive text-xs">
                    {entry.valid_listen_count.toLocaleString("fr-FR")} écoutes ·{" "}
                    {entry.listen_share_percent.toFixed(4)}% du pool
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-texte-principal text-sm font-semibold">
                    {fmtGnf(entry.net_amount_gnf)}
                  </p>
                  <p className={`text-xs font-medium ${st.color}`}>{st.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
