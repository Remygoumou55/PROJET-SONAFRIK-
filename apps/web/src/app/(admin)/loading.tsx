export default function AdminLoading() {
  return (
    <div className="admin-layout">
      <div className="admin-sidebar admin-sidebar--skeleton" aria-hidden="true" />
      <div className="admin-main">
        <div className="admin-header admin-header--skeleton" />
        <div className="admin-dashboard">
          <div className="h-8 w-48 rounded-xl animate-pulse admin-skeleton-block" />
          <div className="admin-kpis-grid" style={{ marginTop: 24 }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="admin-kpi-card admin-skeleton-block h-32 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
