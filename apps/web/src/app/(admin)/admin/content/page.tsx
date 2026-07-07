import { AdminPageFrame } from "@/features/admin/components/AdminPageFrame";
import { AdminHeroSlidesClient } from "@/features/admin/components/AdminHeroSlidesClient";

export const metadata = { title: "Contenu éditorial — Admin SONAFRIK" };
export const dynamic = "force-dynamic";

export default function AdminContentPage() {
  return (
    <AdminPageFrame
      title="Contenu éditorial"
      subtitle="Bannières hero de la page d'accueil /listen"
    >
      <AdminHeroSlidesClient />
    </AdminPageFrame>
  );
}
