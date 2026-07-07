interface DashboardProgressBarProps {
  value: number;
  max?: number;
  label: string;
  showValue?: boolean;
  tone?: "default" | "gold" | "energy";
}

/** Barre de progression compacte — coach, profil, missions. */
export function DashboardProgressBar({
  value,
  max = 100,
  label,
  showValue = true,
  tone = "default",
}: DashboardProgressBarProps) {
  const pct = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  return (
    <div className="dashboard-progress" role="group" aria-label={label}>
      <div className="dashboard-progress__meta">
        <span className="dashboard-progress__label">{label}</span>
        {showValue ? (
          <span className="dashboard-progress__value" aria-hidden="true">
            {pct}%
          </span>
        ) : null}
      </div>
      <div
        className={`dashboard-progress__track dashboard-progress__track--${tone}`}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <span
          className="dashboard-progress__fill"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
