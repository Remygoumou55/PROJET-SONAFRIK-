import { requireAdmin } from "@/features/admin/lib/requireAdmin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="bg-fond-principal min-h-screen">
      <div className="border-bordure border-b px-6 py-3">
        <p className="text-texte-secondaire text-xs font-medium uppercase tracking-wider">
          Administration SONAFRIK
        </p>
      </div>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
