import Link from "next/link";
import { redirect } from "next/navigation";
import { createAuthService } from "@sonafrik/api/auth";
import { Button } from "@sonafrik/ui";
import { AuthHomeActions } from "@/features/auth/components/AuthHomeActions";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;

  // Supabase redirige parfois le code OAuth vers la racine si la redirect URL
  // n'est pas encore dans la liste autorisée du dashboard
  if (params.code) {
    const qs = new URLSearchParams({ code: params.code });
    if (params.next) qs.set("next", params.next);
    redirect(`/auth/callback?${qs.toString()}`);
  }

  const supabase = await getSupabaseServerClient();
  const auth = createAuthService(supabase);
  const profile = await auth.getCurrentProfile();

  if (!profile) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6">
        <div className="max-w-lg text-center">
          <h1 className="mb-2 text-4xl font-extrabold tracking-tight">
            <span className="text-white">SONA</span>
            <span className="text-vert-energie">FRIK</span>
          </h1>
          <p className="mb-1 text-lg font-semibold text-or-solaire">NOTRE BIEN COMMUN</p>
          <p className="text-texte-secondaire mb-8 text-sm">Écoute · Participe · Prospère</p>
        </div>
        <AuthHomeActions />
      </main>
    );
  }

  if (!profile.onboarding_completed) {
    redirect("/auth/inscription");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="max-w-lg text-center">
        <p className="text-texte-secondaire mb-2 text-sm">Bienvenue</p>
        <h1 className="mb-4 text-2xl font-bold text-texte-principal">
          {profile.full_name ?? profile.phone}
        </h1>
        <p className="text-texte-secondaire text-sm capitalize">
          Compte {profile.account_type?.replace("_", " & ")}
        </p>
        <p className="text-or-solaire mt-2 text-xs font-semibold">Sprint 3 — Identity OS actif</p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/profile">Mon profil</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/settings">Paramètres</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
