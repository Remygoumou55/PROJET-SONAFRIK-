import Link from "next/link";
import type { AdminLaunchTargetView } from "../../lib/buildAdminDashboardView";

export function AdminLaunchProgress({ targets }: { targets: AdminLaunchTargetView[] }) {
  return (
    <section className="launch-progress-card" aria-labelledby="launch-progress-title">
      <div className="launch-header">
        <span aria-hidden="true" style={{ fontSize: "18px" }}>
          🚀
        </span>
        <div>
          <h2 id="launch-progress-title" className="launch-title">
            Progression vers le lancement
          </h2>
          <p className="launch-sub">Objectifs avant ouverture publique</p>
        </div>
      </div>

      {targets.map((target) => {
        const pct = Math.min((target.current / Math.max(target.target, 1)) * 100, 100);
        const isReached = pct >= 100;

        return (
          <Link key={target.label} href={target.href} className="launch-item">
            <div className="launch-item-header">
              <span aria-hidden="true">{target.icon}</span>
              <span className="launch-item-label">{target.label}</span>
              <span
                className="launch-item-values"
                style={{ color: isReached ? "var(--color-vert-energie)" : "var(--color-texte-principal)" }}
              >
                {target.current.toLocaleString("fr-FR")} / {target.target.toLocaleString("fr-FR")}
              </span>
              <span
                className="launch-item-pct"
                style={{ color: isReached ? "var(--color-vert-energie)" : "var(--color-or-solaire)" }}
              >
                {isReached ? "✅" : `${pct.toFixed(0)}%`}
              </span>
            </div>
            <div className="launch-bar">
              <div
                className="launch-bar-fill"
                style={{
                  width: `${pct}%`,
                  background: isReached
                    ? "var(--color-vert-energie)"
                    : `linear-gradient(90deg, var(--color-vert-energie) ${pct}%, var(--color-or-solaire) 100%)`,
                }}
              />
            </div>
          </Link>
        );
      })}
    </section>
  );
}
