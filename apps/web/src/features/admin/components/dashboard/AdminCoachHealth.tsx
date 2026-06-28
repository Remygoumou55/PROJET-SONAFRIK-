import type { AdminCoachTip, AdminHealthServiceView } from "../../lib/buildAdminDashboardView";

export function AdminCoachCard({ tips }: { tips: AdminCoachTip[] }) {
  return (
    <section className="admin-human-coach" aria-labelledby="admin-coach-title">
      <div className="admin-human-coach__badge">Coach SONAFRIK</div>
      <h2 id="admin-coach-title" className="admin-human-section-title">
        Conseils du jour
      </h2>
      <p className="admin-human-section-sub">Analyse métier de votre plateforme — sans jargon technique</p>
      <ul className="admin-human-coach__list">
        {tips.map((tip) => (
          <li key={tip.id} className="admin-human-coach__tip">
            {tip.text}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function AdminPlatformHealthCard({ services }: { services: AdminHealthServiceView[] }) {
  const allOk = services.every((s) => s.ok);

  return (
    <section className="admin-human-health" aria-labelledby="admin-health-title">
      <div className="admin-human-health__head">
        <h2 id="admin-health-title" className="admin-human-section-title">
          Santé SONAFRIK
        </h2>
        <span className={`admin-human-health__badge${allOk ? " admin-human-health__badge--ok" : ""}`}>
          {allOk ? "Tout opérationnel" : "Surveillance active"}
        </span>
      </div>
      <ul className="admin-human-health__list">
        {services.map((service) => (
          <li key={service.id} className="admin-human-health__row">
            <span className={`admin-human-health__status${service.ok ? " admin-human-health__status--ok" : ""}`}>
              {service.ok ? "●" : "○"}
            </span>
            <div className="admin-human-health__info">
              <p className="admin-human-health__label">{service.label}</p>
              <p className="admin-human-health__detail">{service.detail}</p>
            </div>
            {service.latencyMs !== undefined ? (
              <span className="admin-human-health__latency">{service.latencyMs} ms</span>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
