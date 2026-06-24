import { Suspense } from "react";
import { CreatorLayoutClient } from "@/features/creator/components/CreatorLayoutClient";
import { DevAuthBootstrap } from "@/features/auth/components/DevAuthBootstrap";
import { requireCreatorContext } from "@/features/creator/lib/requireCreator";
import CreatorLoading from "./loading";

async function CreatorGuard({ children }: { children: React.ReactNode }) {
  const context = await requireCreatorContext();
  return (
    <>
      <DevAuthBootstrap />
      <CreatorLayoutClient pendingVerifications={context.pendingVerifications}>
        {children}
      </CreatorLayoutClient>
    </>
  );
}

export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<CreatorLoading />}>
      <CreatorGuard>{children}</CreatorGuard>
    </Suspense>
  );
}
