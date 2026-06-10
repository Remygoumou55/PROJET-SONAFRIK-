import { CreatorLayoutClient } from "@/features/creator/components/CreatorLayoutClient";
import { requireCreatorContext } from "@/features/creator/lib/requireCreator";

export default async function CreatorLayout({ children }: { children: React.ReactNode }) {
  const context = await requireCreatorContext();
  return (
    <CreatorLayoutClient pendingVerifications={context.pendingVerifications}>
      {children}
    </CreatorLayoutClient>
  );
}
