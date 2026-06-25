import { Suspense } from "react";
import { AuthPageLoading } from "@/features/auth/components/AuthPageLoading";
import { ConnexionPageClient } from "./ConnexionPageClient";

export const metadata = { title: "Créer votre compte — SONAFRIK" };

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
  const bypassAuth = process.env.BYPASS_AUTH === "true";
  const initialRole = roleFromParam(params.role);

  return (
    <Suspense fallback={<AuthPageLoading />}>
      <ConnexionPageClient bypassAuth={bypassAuth} initialRole={initialRole} />
    </Suspense>
  );
}
