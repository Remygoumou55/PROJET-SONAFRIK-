import { AdminModulePlaceholder } from "@/features/admin/components/AdminModulePlaceholder";

export const metadata = { title: "Modération — Admin SONAFRIK" };

export default function AdminModerationPage() {
  return (
    <AdminModulePlaceholder
      title="Modération"
      sprintLabel="Sprint Admin 4 — fraude actuelle sur /admin/fraud"
      icon="⚖️"
    />
  );
}
