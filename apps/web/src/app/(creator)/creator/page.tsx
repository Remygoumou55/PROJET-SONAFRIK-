import { Suspense } from "react";
import Link from "next/link";
import { CreatorDashboard } from "@/features/creator/components/CreatorDashboard";
import { requireCreatorContext } from "@/features/creator/lib/requireCreator";
import { formatCreatorGreeting } from "@/features/creator/lib/greeting";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { createCreatorService } from "@sonafrik/api/creator";
import { createListenerService } from "@sonafrik/api/listener";
import CreatorPageLoading from "./loading";

async function CreatorDashboardContent() {
  const context = await requireCreatorContext();
  const supabase = await getSupabaseServerClient();
  const stageName = context.artistProfile.stage_name || "Artiste";

  const [data, careerOsEnabled] = await Promise.all([
    createCreatorService(supabase).getDashboardDataForContext(context),
    createListenerService(supabase).isFeatureEnabled("career_os").catch(() => false),
  ]);

  return (
    <CreatorDashboard
      data={data}
      careerOsEnabled={careerOsEnabled}
      greeting={formatCreatorGreeting(stageName)}
    />
  );
}

function CreatorDashboardError() {
  return (
    <div
      className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center"
      role="alert"
    >
      <p className="text-sm text-texte-secondaire">
        Impossible de charger votre espace artiste pour le moment.
      </p>
      <Link
        href="/creator"
        className="rounded-xl px-5 py-2.5 text-sm font-semibold"
        style={{
          backgroundColor: "var(--color-vert-energie)",
          color: "var(--color-noir-profond)",
        }}
      >
        Réessayer
      </Link>
      <Link href="/profile" className="text-sm text-texte-desactive hover:underline">
        Retour au profil
      </Link>
    </div>
  );
}

export default function CreatorDashboardPage() {
  return (
    <Suspense fallback={<CreatorPageLoading />}>
      <CreatorDashboardBoundary />
    </Suspense>
  );
}

async function CreatorDashboardBoundary() {
  try {
    return await CreatorDashboardContent();
  } catch (e) {
    // Next.js redirect() throws a NEXT_REDIRECT error — must re-throw or the redirect is swallowed
    const digest = (e as { digest?: string })?.digest;
    if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) {
      throw e;
    }
    console.error("[CreatorDashboard] crash:", e);
    return <CreatorDashboardError />;
  }
}
