import { Suspense } from "react";
import { IdentityLayoutClient } from "@/features/identity/components/IdentityLayoutClient";
import { requireIdentityContext, redirectIfOnboardingIncomplete } from "@/features/identity/lib/requireIdentity";
import IdentityLoading from "./loading";

async function IdentityGuard({ children }: { children: React.ReactNode }) {
  const context = await requireIdentityContext();
  redirectIfOnboardingIncomplete(context.profile);

  return (
    <IdentityLayoutClient unreadNotifications={context.unreadNotifications}>
      {children}
    </IdentityLayoutClient>
  );
}

export default function IdentityLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<IdentityLoading />}>
      <IdentityGuard>{children}</IdentityGuard>
    </Suspense>
  );
}
