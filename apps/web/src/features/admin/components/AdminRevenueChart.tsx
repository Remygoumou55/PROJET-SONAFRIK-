import type { AdminMonthlyRevenue } from "@sonafrik/api/admin";

interface AdminRevenueChartProps {
  data: AdminMonthlyRevenue[];
}

export function AdminRevenueChart({ data }: AdminRevenueChartProps) {
  const max = Math.max(...data.map((item) => item.totalGnf), 1);

  return (
    <div className="admin-revenue-chart" aria-label="Revenus wallet sur 12 mois">
      <div className="admin-revenue-bars">
        {data.map((item) => {
          const height = Math.max(4, (item.totalGnf / max) * 100);
          return (
            <div key={item.monthKey} className="admin-revenue-bar-col">
              <div
                className="admin-revenue-bar"
                style={{ height: `${height}%` }}
                title={`${item.label} — ${item.totalGnf.toLocaleString("fr-FR")} GNF`}
              />
              <span className="admin-revenue-bar-label">{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
