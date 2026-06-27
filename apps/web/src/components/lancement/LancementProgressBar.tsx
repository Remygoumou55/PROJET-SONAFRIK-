interface LancementProgressBarProps {
  current: number;
  target: number;
  percentage: number;
  launched: boolean;
}

export function LancementProgressBar({
  current,
  target,
  percentage,
  launched,
}: LancementProgressBarProps) {
  const safePercent = Math.min(Math.max(percentage, 0), 100);
  const remaining = Math.max(target - current, 0);
  const fillWidth = safePercent > 0 ? Math.max(safePercent, 2) : 0;

  let message = "Soyez parmi les premiers à rejoindre SONAFRIK";
  if (launched) {
    message = "🎉 Objectif atteint — lancement en cours !";
  } else if (current > 0 && remaining > 0) {
    message = `Plus que ${remaining.toLocaleString("fr-FR")} personnes pour le lancement officiel`;
  }

  return (
    <div className="lancement-progress-wrap" aria-label="Progression abonnés de lancement">
      <div className="lancement-progress-header">
        <span className="lancement-progress-label">Abonnés de lancement</span>
        <span className="lancement-progress-count">
          <strong>{current.toLocaleString("fr-FR")}</strong> / {target.toLocaleString("fr-FR")}
        </span>
      </div>
      <div className="lancement-progress-track">
        <div className="lancement-progress-fill" style={{ width: `${fillWidth}%` }}>
          {fillWidth > 0 ? <span className="lancement-progress-glow" aria-hidden="true" /> : null}
        </div>
      </div>
      <p className="lancement-progress-message">{message}</p>
    </div>
  );
}
