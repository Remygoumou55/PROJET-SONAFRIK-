import type { CreatorDashboardCareerStep } from "@sonafrik/types";

export function CareerProgressCard({ steps }: { steps: CreatorDashboardCareerStep[] }) {
  const completed = steps.filter((s) => s.completed).length;
  const overall = Math.round((completed / steps.length) * 100);

  return (
    <section className="creator-widget creator-career" aria-label="Votre carrière SONAFRIK">
      <div className="creator-career__header">
        <h2 className="creator-widget__title">Votre carrière SONAFRIK</h2>
        <span className="creator-career__overall">{overall} %</span>
      </div>
      <div
        className="creator-career__overall-track"
        role="progressbar"
        aria-valuenow={overall}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progression globale de carrière"
      >
        <div className="creator-career__overall-fill" style={{ width: `${overall}%` }} />
      </div>
      <ul className="creator-career__list">
        {steps.map((step) => (
          <li key={step.id} className={`creator-career__step ${step.completed ? "creator-career__step--done" : ""}`}>
            <span className="creator-career__icon" aria-hidden="true">
              {step.icon}
            </span>
            <div className="creator-career__body">
              <span className="creator-career__label">{step.label}</span>
              <span className="creator-career__track">
                <span className="creator-career__fill" style={{ width: `${step.progressPercent}%` }} />
              </span>
            </div>
            {step.completed ? (
              <span className="creator-career__badge" aria-label="Complété">
                ✓
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
