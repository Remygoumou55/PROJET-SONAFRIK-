import type { StreamTimelineEntry } from "@sonafrik/types";

export function SparklineChart({ entries }: { entries: StreamTimelineEntry[] }) {
  if (entries.length === 0) return null;

  const max = Math.max(...entries.map((e) => e.streams), 1);
  const width = 100;
  const height = 48;
  const step = width / Math.max(entries.length - 1, 1);

  const points = entries
    .map((e, i) => {
      const x = i * step;
      const y = height - (e.streams / max) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="creator-sparkline"
      preserveAspectRatio="none"
      role="img"
      aria-label="Graphique d'évolution des écoutes"
    >
      <polygon points={areaPoints} className="creator-sparkline__area" />
      <polyline points={points} className="creator-sparkline__line" fill="none" />
    </svg>
  );
}
