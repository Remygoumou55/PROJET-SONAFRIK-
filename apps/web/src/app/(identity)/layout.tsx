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
    <>
      {/* Avatars Google — préconnecter avant le rendu du profil */}
      <link rel="preconnect" href="https://lh3.googleusercontent.com" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://lh3.googleusercontent.com" />
      <Suspense fallback={<IdentityLoading />}>
        <IdentityGuard>{children}</IdentityGuard>
      </Suspense>
    </>
  );
}
