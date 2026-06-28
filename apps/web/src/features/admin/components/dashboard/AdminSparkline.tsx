export function AdminSparkline({ values, trend }: { values: number[]; trend: "up" | "down" | "neutral" }) {
  const w = 72;
  const h = 28;
  const max = Math.max(...values, 1);
  const points = values
    .map((v, i) => {
      const x = (i / Math.max(values.length - 1, 1)) * w;
      const y = h - (v / max) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  const stroke =
    trend === "up"
      ? "var(--color-vert-energie)"
      : trend === "down"
        ? "var(--color-erreur)"
        : "var(--color-or-solaire)";

  return (
    <svg
      className="admin-human-sparkline"
      viewBox={`0 0 ${w} ${h}`}
      width={w}
      height={h}
      aria-hidden="true"
    >
      <polyline fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" points={points} />
    </svg>
  );
}
