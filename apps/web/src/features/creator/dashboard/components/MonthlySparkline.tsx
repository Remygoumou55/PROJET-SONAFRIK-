import type { CreatorMonthlyRevenuePoint } from "@sonafrik/types";

export function MonthlySparkline({ points }: { points: CreatorMonthlyRevenuePoint[] }) {
  if (points.length === 0) return null;

  const max = Math.max(...points.map((p) => p.amountGnf), 1);
  const width = 100;
  const height = 48;
  const step = width / Math.max(points.length - 1, 1);

  const coords = points
    .map((p, i) => {
      const x = i * step;
      const y = height - (p.amountGnf / max) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  const areaPoints = `0,${height} ${coords} ${width},${height}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="creator-sparkline"
      preserveAspectRatio="none"
      role="img"
      aria-label="Graphique des revenus sur 6 mois"
    >
      <polygon points={areaPoints} className="creator-sparkline__area creator-sparkline__area--gold" />
      <polyline points={coords} className="creator-sparkline__line creator-sparkline__line--gold" fill="none" />
    </svg>
  );
}
