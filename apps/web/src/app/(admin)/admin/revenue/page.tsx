import { AdminModulePlaceholder } from "@/features/admin/components/AdminModulePlaceholder";

export const metadata = { title: "Revenus — Admin SONAFRIK" };

export default function AdminRevenuePage() {
  return (
    <AdminModulePlaceholder
      title="Revenus"
      sprintLabel="Sprint Admin 3 — voir aussi Finances (/admin/finance)"
      icon="💰"
    />
  );
}
