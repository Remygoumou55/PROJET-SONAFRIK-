interface AdminPageFrameProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}

/** Enveloppe visuelle commune pour les pages admin MVP + placeholders. */
export function AdminPageFrame({ title, subtitle, children }: AdminPageFrameProps) {
  return (
    <div className="admin-dashboard">
      {title ? (
        <div className="admin-page-header">
          <h1 className="admin-page-title">{title}</h1>
          {subtitle ? <p className="admin-page-sub">{subtitle}</p> : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}
