export default function AdminLoading() {
  return (
    <div className="admin-layout enterprise-shell" aria-busy="true" aria-label="Chargement admin">
      <div className="enterprise-sidebar-card">
        <aside className="music-sidebar music-sidebar--admin music-sidebar--skeleton" aria-hidden="true">
          <div className="music-sidebar__body">
            <div className="music-sidebar__brand admin-skeleton-block h-12 animate-pulse" />
            <div className="music-nav__group" style={{ padding: "0.75rem" }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="admin-skeleton-block h-9 rounded-lg animate-pulse mb-1" />
              ))}
            </div>
          </div>
        </aside>
      </div>
      <div className="enterprise-main-column admin-main">
        <div className="music-header enterprise-header-card admin-header--skeleton admin-skeleton-block h-14 animate-pulse" />
        <div className="enterprise-content-card admin-content">
          <div className="enterprise-content-card__inner admin-dashboard">
            <div className="h-8 w-48 rounded-xl animate-pulse admin-skeleton-block" />
            <div className="admin-kpis-grid" style={{ marginTop: 24 }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="admin-kpi-card admin-skeleton-block h-32 animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
