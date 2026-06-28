interface AdminModulePlaceholderProps {
  title: string;
  sprintLabel: string;
  icon?: string;
}

export function AdminModulePlaceholder({
  title,
  sprintLabel,
  icon = "🔧",
}: AdminModulePlaceholderProps) {
  return (
    <div className="admin-dashboard">
      <div className="admin-page-header">
        <h1 className="admin-page-title">{title}</h1>
        <p className="admin-page-sub">Module en cours de construction — {sprintLabel}</p>
      </div>
      <div className="admin-module-placeholder">
        <span className="admin-module-placeholder-icon" aria-hidden="true">
          {icon}
        </span>
        <p>Ce module sera disponible prochainement.</p>
      </div>
    </div>
  );
}
