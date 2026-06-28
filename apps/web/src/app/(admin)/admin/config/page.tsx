import { AdminModulePlaceholder } from "@/features/admin/components/AdminModulePlaceholder";

export const metadata = { title: "Config Règles — Admin SONAFRIK" };

export default function AdminConfigPage() {
  return (
    <AdminModulePlaceholder
      title="Config Règles Métiers"
      sprintLabel="Sprint Admin 6 — paramètres actifs sur /admin/settings"
      icon="⚙️"
    />
  );
}
