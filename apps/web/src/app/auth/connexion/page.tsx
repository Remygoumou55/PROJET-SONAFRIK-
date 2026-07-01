import { Suspense } from "react";
import { AuthPageLoading } from "@/features/identity/auth/components/AuthPageLoading";
import { isDevBypassActive } from "@/lib/auth/guards";
import { resolveAuthFeatureFlags } from "@/lib/auth/auth-feature-flags";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { ConnexionPageClient } from "./ConnexionPageClient";

export const metadata = {
  title: "Connexion — SONAFRIK",
  description:
    "Rejoignez SONAFRIK en un clic avec votre compte Google — musique guinéenne, africaine et mondiale.",
};

function roleFromParam(value: string | string[] | undefined): "artist" | "listener" | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "artist" || raw === "listener") return raw;
  return null;
}

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const bypassAuth = isDevBypassActive();
  const initialRole = roleFromParam(params.role);
  const supabase = await getSupabaseServerClient();
  const authFlags = await resolveAuthFeatureFlags(supabase);

  return (
    <Suspense fallback={<AuthPageLoading />}>
      <ConnexionPageClient
        bypassAuth={bypassAuth}
        phoneAuthEnabled={authFlags.phoneAuthEnabled}
        initialRole={initialRole}
      />
    </Suspense>
  );
}
