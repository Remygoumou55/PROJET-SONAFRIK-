import { AdminPageFrame } from "@/features/admin/components/AdminPageFrame";

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
    <AdminPageFrame title={title} subtitle={`Module en cours de construction — ${sprintLabel}`}>
      <div className="admin-module-placeholder">
        <span className="admin-module-placeholder-icon" aria-hidden="true">
          {icon}
        </span>
        <p>Ce module sera disponible prochainement.</p>
      </div>
    </AdminPageFrame>
  );
}
