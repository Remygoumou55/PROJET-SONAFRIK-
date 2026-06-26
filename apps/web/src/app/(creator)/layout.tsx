import { Suspense } from "react";
import { CreatorLayoutClient } from "@/features/creator/components/CreatorLayoutClient";
import { DevAuthBootstrap } from "@/features/auth/components/DevAuthBootstrap";
import { requireCreatorContext } from "@/features/creator/lib/requireCreator";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { PerformanceProvider, resolvePerformanceFlags } from "@/lib/performance";
import CreatorLoading from "./loading";

async function CreatorGuard({ children }: { children: React.ReactNode }) {
  const context = await requireCreatorContext();
  const supabase = await getSupabaseServerClient();
  const performanceFlags = await resolvePerformanceFlags(supabase);

  return (
    <PerformanceProvider flags={performanceFlags}>
      <DevAuthBootstrap />
      <CreatorLayoutClient pendingVerifications={context.pendingVerifications}>
        {children}
      </CreatorLayoutClient>
    </PerformanceProvider>
  );
}

export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<CreatorLoading />}>
      <CreatorGuard>{children}</CreatorGuard>
    </Suspense>
  );
}
