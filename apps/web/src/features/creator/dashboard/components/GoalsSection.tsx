import type { CreatorDashboardGoal } from "@sonafrik/types";
import Link from "next/link";

const CATEGORY_LABELS: Record<CreatorDashboardGoal["category"], string> = {
  daily: "Aujourd'hui",
  weekly: "Cette semaine",
  monthly: "Ce mois",
};

export function GoalsSection({ goals }: { goals: CreatorDashboardGoal[] }) {
  const grouped = {
    daily: goals.filter((g) => g.category === "daily"),
    weekly: goals.filter((g) => g.category === "weekly"),
    monthly: goals.filter((g) => g.category === "monthly"),
  };

  return (
    <section className="creator-widget creator-goals" aria-label="Vos objectifs">
      <h2 className="creator-widget__title">Vos objectifs</h2>
      <div className="creator-goals__groups">
        {(Object.keys(grouped) as Array<keyof typeof grouped>).map((cat) =>
          grouped[cat].length > 0 ? (
            <div key={cat} className="creator-goals__group">
              <h3 className="creator-goals__category">{CATEGORY_LABELS[cat]}</h3>
              <ul className="creator-goals__list">
                {grouped[cat].map((goal) => (
                  <li key={goal.id}>
                    <Link href={goal.href} className={`creator-goal ${goal.completed ? "creator-goal--done" : ""}`}>
                      <span className="creator-goal__check" aria-hidden="true">
                        {goal.completed ? "✓" : "○"}
                      </span>
                      <div className="creator-goal__body">
                        <span className="creator-goal__label">{goal.label}</span>
                        <span className="creator-goal__reward">{goal.rewardLabel}</span>
                        {!goal.completed ? (
                          <span className="creator-goal__progress-track">
                            <span className="creator-goal__progress-fill" style={{ width: `${goal.progressPercent}%` }} />
                          </span>
                        ) : null}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null,
        )}
      </div>
    </section>
  );
}
