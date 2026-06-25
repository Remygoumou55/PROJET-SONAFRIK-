import type { Metadata } from "next";
import Link from "next/link";
import type { LaunchProgress } from "@sonafrik/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { parseLaunchProgress } from "@/lib/landing/parseLaunchProgress";

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

async function getLaunchProgress(): Promise<LaunchProgress> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase.rpc("get_launch_progress");
    if (error || !data) throw new Error("rpc failed");
    return parseLaunchProgress(data);
  } catch {
    return parseLaunchProgress(null);
  }
}

export default async function LancementPage() {
  const progress = await getLaunchProgress();

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--color-noir-profond)", color: "var(--color-texte-principal)" }}
    >
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5">
        <div>
          <span className="text-lg font-black tracking-wider" style={{ color: "var(--color-or-solaire)" }}>
            SONAFRIK
          </span>
          <span className="ml-2 text-xs" style={{ color: "var(--color-texte-desactive)" }}>
            NOTRE BIEN COMMUN
          </span>
        </div>
        <Link
          href="/auth/connexion"
          className="rounded-full px-4 py-1.5 text-sm font-medium transition-opacity hover:opacity-80"
          style={{ backgroundColor: "var(--color-surface)", color: "var(--color-texte-principal)", border: "1px solid var(--color-elevated)" }}
        >
          Se connecter
        </Link>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
        {/* Slogan */}
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] mb-4" style={{ color: "var(--color-or-solaire)" }}>
            Écoute · Participe · Prospère
          </p>
          <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-4">
            La musique guinéenne<br />
            <span style={{ color: "var(--color-vert-energie)" }}>mérite sa plateforme</span>
          </h1>
          <p className="max-w-md mx-auto text-base leading-relaxed" style={{ color: "var(--color-texte-subtil)" }}>
            SONAFRIK rémunère directement les artistes. Chaque écoute compte.
            Ensemble, nous débloquons le lancement.
          </p>
        </div>

        {/* Compteur */}
        <div
          className="w-full max-w-lg rounded-2xl p-8 mb-10"
          style={{ backgroundColor: "var(--color-noir-profond)", border: "1px solid var(--color-surface)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: "var(--color-texte-desactive)" }}>
            Objectif de lancement — CDC Règle #7
          </p>

          {/* Chiffres */}
          <div className="mb-4 flex items-end justify-between">
            <div>
              <span className="text-6xl font-black tabular-nums leading-none" style={{ color: "var(--color-vert-energie)" }}>
                {progress.current.toLocaleString("fr-FR")}
              </span>
              <span className="ml-2 text-2xl font-bold" style={{ color: "var(--color-texte-desactive)" }}>
                /{progress.target.toLocaleString("fr-FR")}
              </span>
            </div>
            <span className="text-lg font-semibold" style={{ color: "var(--color-vert-energie)" }}>
              {progress.percent.toFixed(1)} %
            </span>
          </div>

          {/* Barre de progression */}
          <div
            style={{
              height: "8px",
              width: "100%",
              backgroundColor: "var(--color-card)",
              border: "1px solid var(--color-elevated)",
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progress.percent}%`,
                backgroundColor: "var(--color-vert-energie)",
                borderRadius: "4px",
                transition: "width 0.6s ease",
              }}
            />
          </div>

          <p className="mt-3 text-sm text-center" style={{ color: "var(--color-texte-desactive)" }}>
            {progress.launched
              ? "Objectif atteint — SONAFRIK est lancé ! 🚀"
              : `${(progress.target - progress.current).toLocaleString("fr-FR")} abonnés manquants pour le lancement`}
          </p>
        </div>

        {/* CTA */}
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            href="/auth/connexion"
            className="rounded-full px-8 py-3 text-sm font-bold transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--color-vert-energie)", color: "var(--color-noir-profond)" }}
          >
            Rejoindre SONAFRIK
          </Link>
          <Link
            href="/auth/connexion?role=listener"
            className="rounded-full px-8 py-3 text-sm font-medium transition-opacity hover:opacity-80"
            style={{ backgroundColor: "var(--color-surface)", color: "var(--color-texte-principal)", border: "1px solid var(--color-elevated)" }}
          >
            Rejoindre comme auditeur
          </Link>
        </div>

        {/* Règles CDC */}
        <div className="mt-16 grid gap-4 sm:grid-cols-3 max-w-2xl w-full text-left">
          {[
            { rule: "#3", label: "65% reversés aux artistes", icon: "🎵" },
            { rule: "#4", label: "Beat Store à 0% de commission", icon: "🎹" },
            { rule: "#5", label: "Pourboires directs aux artistes", icon: "💸" },
          ].map(({ rule, label, icon }) => (
            <div
              key={rule}
              className="rounded-xl p-4"
              style={{ backgroundColor: "var(--color-noir-profond)", border: "1px solid var(--color-surface)" }}
            >
              <p className="text-lg mb-1">{icon}</p>
              <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--color-or-solaire)" }}>
                Règle CDC {rule}
              </p>
              <p className="text-sm" style={{ color: "var(--color-texte-secondaire)" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Preuve sociale — artistes fondateurs */}
        <div className="mt-12 mb-8 w-full max-w-2xl text-center">
          <p className="text-base font-bold mb-1" style={{ color: "var(--color-texte-principal)" }}>
            Déjà sur SONAFRIK
          </p>
          <p className="mb-6" style={{ color: "var(--color-texte-secondaire)", fontSize: "14px" }}>
            Les premiers artistes qui font confiance à la plateforme
          </p>

          {/* Avatars — 5 artistes fondateurs */}
          <div className="flex flex-wrap justify-center gap-4">
            {([
              { initials: "AD", name: "Alpha Diallo", genre: "Afrobeat",    bg: "rgba(0, 210, 106, 0.16)",   borderColor: "rgba(0, 210, 106, 0.38)" },
              { initials: "F",  name: "Faya",         genre: "R&B Africain",bg: "rgba(255, 194, 14, 0.16)",  borderColor: "rgba(255, 194, 14, 0.38)" },
              { initials: "DS", name: "Djeli Sow",    genre: "Traditionnel",bg: "rgba(168, 85, 247, 0.16)",  borderColor: "rgba(168, 85, 247, 0.38)" },
              { initials: "MF", name: "MC Fly",       genre: "Rap GN",      bg: "rgba(59, 130, 246, 0.16)",  borderColor: "rgba(59, 130, 246, 0.38)" },
              { initials: "S",  name: "SeK",          genre: "Gospel",       bg: "rgba(249, 115, 22, 0.16)",  borderColor: "rgba(249, 115, 22, 0.38)" },
            ] as const).map(({ initials, name, genre, bg, borderColor }) => (
              <div key={name} className="flex flex-col items-center" style={{ width: "72px" }}>
                <div
                  className="flex items-center justify-center rounded-full mb-2"
                  style={{
                    width: "52px",
                    height: "52px",
                    backgroundColor: bg,
                    border: `2px solid ${borderColor}`,
                    color: "var(--color-texte-principal)",
                    fontWeight: 600,
                    fontSize: "16px",
                  }}
                >
                  {initials}
                </div>
                <p style={{ fontSize: "12px", color: "var(--color-texte-principal)", fontWeight: 500, lineHeight: "1.3" }}>
                  {name}
                </p>
                <p style={{ fontSize: "11px", color: "var(--color-texte-secondaire)", lineHeight: "1.3" }}>
                  {genre}
                </p>
              </div>
            ))}
          </div>

          {/* Badge stats */}
          <div className="mt-5 inline-block">
            <span
              style={{
                display: "inline-block",
                backgroundColor: "var(--color-card)",
                border: "1px solid var(--color-elevated)",
                borderRadius: "20px",
                padding: "6px 16px",
                fontSize: "12px",
                color: "var(--color-texte-secondaire)",
              }}
            >
              🎵 5 artistes · 30 morceaux · Guinée Conakry
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-6 text-center">
        <p className="text-xs" style={{ color: "var(--color-bordure)" }}>
          © 2026 SONAFRIK — Notre Bien Commun
        </p>
      </footer>
    </div>
  );
}
