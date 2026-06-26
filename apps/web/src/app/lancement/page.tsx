import type { Metadata } from "next";
import Link from "next/link";
import { getLaunchProgress } from "@/lib/landing/getLaunchProgress";
import { getLandingArtistsSection } from "@/lib/landing/getLandingArtistsSection";
import { getAvatarPalette } from "@/lib/landing/artistDisplay";
import { SonafrikLogo } from "@/components/shared/SonafrikLogo";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "SONAFRIK — Notre Bien Commun",
  description:
    "Rejoignez le mouvement SONAFRIK. Plateforme de streaming musical guinéenne en route vers son lancement officiel.",
  openGraph: {
    title: "SONAFRIK — Notre Bien Commun",
    description: "2 000 abonnés = lancement de la plateforme musicale guinéenne.",
    siteName: "SONAFRIK",
  },
};

export default async function LancementPage() {
  const [progress, artistsSection] = await Promise.all([
    getLaunchProgress(),
    getLandingArtistsSection(),
  ]);

  const showStats =
    progress !== null && (progress.artistCount > 0 || progress.trackCount > 0);

  return (
    <div className="flex min-h-dvh flex-col bg-noir-profond text-texte-principal">
      <header className="flex items-center justify-between px-6 py-5">
        <div>
          <SonafrikLogo size="footer" />
          <span className="ml-2 text-xs text-texte-desactive">NOTRE BIEN COMMUN</span>
        </div>
        <Link
          href="/auth/connexion"
          className="rounded-full border border-elevated bg-surface px-4 py-1.5 text-sm font-medium text-texte-principal transition-opacity hover:opacity-80"
        >
          Se connecter
        </Link>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
        <div className="mb-10">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-or-solaire">
            Écoute · Participe · Prospère
          </p>
          <h1 className="mb-4 text-4xl font-black leading-tight sm:text-5xl">
            La musique guinéenne
            <br />
            <span className="text-vert-energie">mérite sa plateforme</span>
          </h1>
          <p className="mx-auto max-w-md text-base leading-relaxed text-texte-subtil">
            SONAFRIK rémunère directement les artistes. Chaque écoute compte.
            Ensemble, nous débloquons le lancement.
          </p>
        </div>

        <div className="mb-10 w-full max-w-lg rounded-2xl border border-surface bg-noir-profond p-8">
          <p className="mb-6 text-xs font-semibold uppercase tracking-widest text-texte-desactive">
            Objectif de lancement — CDC Règle #7
          </p>

          {progress ? (
            <>
              <div className="mb-4 flex items-end justify-between">
                <div>
                  <span className="text-6xl font-black tabular-nums leading-none text-vert-energie">
                    {progress.current.toLocaleString("fr-FR")}
                  </span>
                  <span className="ml-2 text-2xl font-bold text-texte-desactive">
                    /{progress.target.toLocaleString("fr-FR")}
                  </span>
                </div>
                <span className="text-lg font-semibold text-vert-energie">
                  {progress.percent.toFixed(1)} %
                </span>
              </div>

              <div className="h-2 w-full overflow-hidden rounded border border-elevated bg-card">
                <div
                  className="h-full rounded bg-vert-energie transition-[width] duration-500 ease-out"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>

              <p className="mt-3 text-center text-sm text-texte-desactive">
                {progress.launched
                  ? "Objectif atteint — SONAFRIK est lancé ! 🚀"
                  : `Plus que ${(progress.target - progress.current).toLocaleString("fr-FR")} personnes pour le lancement officiel`}
              </p>
            </>
          ) : (
            <p className="text-center text-sm text-texte-secondaire">
              Lancement en cours de préparation
            </p>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/auth/connexion"
            className="rounded-full bg-vert-energie px-8 py-3 text-sm font-bold text-noir-profond transition-opacity hover:opacity-90"
          >
            Rejoindre SONAFRIK
          </Link>
          <Link
            href="/auth/connexion?role=listener"
            className="rounded-full border border-elevated bg-surface px-8 py-3 text-sm font-medium text-texte-principal transition-opacity hover:opacity-80"
          >
            Rejoindre comme auditeur
          </Link>
        </div>

        <div className="mt-16 grid w-full max-w-2xl gap-4 text-left sm:grid-cols-3">
          {[
            { rule: "#3", label: "65% reversés aux artistes", icon: "🎵" },
            { rule: "#4", label: "Beat Store à 0% de commission", icon: "🎹" },
            { rule: "#5", label: "Pourboires directs aux artistes", icon: "💸" },
          ].map(({ rule, label, icon }) => (
            <div
              key={rule}
              className="rounded-xl border border-surface bg-noir-profond p-4"
            >
              <p className="mb-1 text-lg">{icon}</p>
              <p className="mb-0.5 text-xs font-semibold text-or-solaire">Règle CDC {rule}</p>
              <p className="text-sm text-texte-secondaire">{label}</p>
            </div>
          ))}
        </div>

        {artistsSection.artists.length > 0 ? (
          <div className="mb-8 mt-12 w-full max-w-2xl text-center">
            <p className="mb-1 text-base font-bold text-texte-principal">
              Les artistes fondateurs
            </p>
            <p className="mb-6 text-sm text-texte-secondaire">
              Les premiers artistes qui font confiance à la plateforme
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              {artistsSection.artists.map((artist) => {
                const palette = getAvatarPalette(artist.paletteIndex);
                return (
                  <Link
                    key={artist.creatorId}
                    href={`/listen/artist/${artist.creatorId}`}
                    className="flex w-[72px] flex-col items-center no-underline"
                  >
                    <div
                      className={`mb-2 flex size-[52px] items-center justify-center rounded-full border-2 text-base font-semibold ${palette.bg} ${palette.text} ${palette.border}`}
                    >
                      {artist.initials}
                    </div>
                    <p className="text-xs font-medium leading-snug text-texte-principal">
                      {artist.stageName}
                    </p>
                    <p className="text-[11px] leading-snug text-texte-secondaire">
                      {artist.genre}
                    </p>
                  </Link>
                );
              })}
            </div>

            {showStats && progress ? (
              <div className="mt-5 inline-block">
                <span className="inline-block rounded-full border border-elevated bg-card px-4 py-1.5 text-xs text-texte-secondaire">
                  🎵 {progress.artistCount.toLocaleString("fr-FR")} artiste
                  {progress.artistCount > 1 ? "s" : ""} ·{" "}
                  {progress.trackCount.toLocaleString("fr-FR")} morceau
                  {progress.trackCount > 1 ? "x" : ""} · Guinée Conakry
                </span>
              </div>
            ) : null}
          </div>
        ) : null}
      </main>

      <footer className="px-6 py-6 text-center">
        <p className="text-xs text-bordure">© 2026 SONAFRIK — Notre Bien Commun</p>
      </footer>
    </div>
  );
}
