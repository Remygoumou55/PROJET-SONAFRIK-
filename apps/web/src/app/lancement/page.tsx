import Link from "next/link";
import type { Metadata } from "next";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
import type { LaunchProgress } from "@sonafrik/types";

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
    const { data, error } = await supabase.rpc("get_launch_progress" as never);
    if (error || !data) throw new Error("rpc failed");

    const raw = data as { current: number; target: number };
    const current = Number(raw.current);
    const target  = Math.max(Number(raw.target), 1);
    const percent = Math.min((current / target) * 100, 100);
    return { current, target, percent, launched: current >= target };
  } catch {
    return { current: 0, target: 2000, percent: 0, launched: false };
  }
}

export default async function LancementPage() {
  const progress = await getLaunchProgress();

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#0D0D0D", color: "#FFFFFF" }}
    >
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5">
        <div>
          <span className="text-lg font-black tracking-wider" style={{ color: "#FFC20E" }}>
            SONAFRIK
          </span>
          <span className="ml-2 text-xs" style={{ color: "#444444" }}>
            NOTRE BIEN COMMUN
          </span>
        </div>
        <Link
          href="/auth/connexion"
          className="rounded-full px-4 py-1.5 text-sm font-medium transition-opacity hover:opacity-80"
          style={{ backgroundColor: "#1A1A1A", color: "#FFFFFF", border: "1px solid #2A2A2A" }}
        >
          Se connecter
        </Link>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
        {/* Slogan */}
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] mb-4" style={{ color: "#FFC20E" }}>
            Écoute · Participe · Prospère
          </p>
          <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-4">
            La musique guinéenne<br />
            <span style={{ color: "#00CC44" }}>mérite sa plateforme</span>
          </h1>
          <p className="max-w-md mx-auto text-base leading-relaxed" style={{ color: "#777777" }}>
            SONAFRIK rémunère directement les artistes. Chaque écoute compte.
            Ensemble, nous débloquons le lancement.
          </p>
        </div>

        {/* Compteur */}
        <div
          className="w-full max-w-lg rounded-2xl p-8 mb-10"
          style={{ backgroundColor: "#111111", border: "1px solid #1E1E1E" }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: "#555555" }}>
            Objectif de lancement — CDC Règle #7
          </p>

          {/* Chiffres */}
          <div className="mb-4 flex items-end justify-between">
            <div>
              <span className="text-6xl font-black tabular-nums leading-none" style={{ color: "#00D26A" }}>
                {progress.current.toLocaleString("fr-FR")}
              </span>
              <span className="ml-2 text-2xl font-bold" style={{ color: "#444444" }}>
                /{progress.target.toLocaleString("fr-FR")}
              </span>
            </div>
            <span className="text-lg font-semibold" style={{ color: "#00D26A" }}>
              {progress.percent.toFixed(1)} %
            </span>
          </div>

          {/* Barre de progression */}
          <div
            style={{
              height: "8px",
              width: "100%",
              backgroundColor: "#1F1F1F",
              border: "1px solid #2A2A2A",
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progress.percent}%`,
                backgroundColor: "#00D26A",
                borderRadius: "4px",
                transition: "width 0.6s ease",
              }}
            />
          </div>

          <p className="mt-3 text-sm text-center" style={{ color: "#555555" }}>
            {progress.launched
              ? "Objectif atteint — SONAFRIK est lancé ! 🚀"
              : `${(progress.target - progress.current).toLocaleString("fr-FR")} abonnés manquants pour le lancement`}
          </p>
        </div>

        {/* CTA */}
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            href="/auth/inscription"
            className="rounded-full px-8 py-3 text-sm font-bold transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#00D26A", color: "#0D0D0D" }}
          >
            Rejoindre SONAFRIK
          </Link>
          <Link
            href="/auth/inscription"
            className="rounded-full px-8 py-3 text-sm font-medium transition-opacity hover:opacity-80"
            style={{ backgroundColor: "#1A1A1A", color: "#FFFFFF", border: "1px solid #2A2A2A" }}
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
              style={{ backgroundColor: "#111111", border: "1px solid #1E1E1E" }}
            >
              <p className="text-lg mb-1">{icon}</p>
              <p className="text-xs font-semibold mb-0.5" style={{ color: "#FFC20E" }}>
                Règle CDC {rule}
              </p>
              <p className="text-sm" style={{ color: "#AAAAAA" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Preuve sociale — artistes fondateurs */}
        <div className="mt-12 mb-8 w-full max-w-2xl text-center">
          <p className="text-base font-bold mb-1" style={{ color: "#FFFFFF" }}>
            Déjà sur SONAFRIK
          </p>
          <p className="mb-6" style={{ color: "#A0A0A0", fontSize: "14px" }}>
            Les premiers artistes qui font confiance à la plateforme
          </p>

          {/* Avatars — 5 artistes fondateurs */}
          <div className="flex flex-wrap justify-center gap-4">
            {([
              { initials: "AD", name: "Alpha Diallo", genre: "Afrobeat",      bg: "#00D26A" },
              { initials: "F",  name: "Faya",         genre: "R&B Africain",  bg: "#FFC20E" },
              { initials: "DS", name: "Djeli Sow",    genre: "Traditionnel",  bg: "#A855F7" },
              { initials: "MF", name: "MC Fly",        genre: "Rap GN",       bg: "#3B82F6" },
              { initials: "S",  name: "SeK",           genre: "Gospel",        bg: "#F97316" },
            ] as const).map(({ initials, name, genre, bg }) => (
              <div key={name} className="flex flex-col items-center" style={{ width: "72px" }}>
                <div
                  className="flex items-center justify-center rounded-full mb-2"
                  style={{
                    width: "52px",
                    height: "52px",
                    backgroundColor: `${bg}28`,
                    border: `2px solid ${bg}60`,
                    color: "#FFFFFF",
                    fontWeight: 600,
                    fontSize: "16px",
                  }}
                >
                  {initials}
                </div>
                <p style={{ fontSize: "12px", color: "#FFFFFF", fontWeight: 500, lineHeight: "1.3" }}>
                  {name}
                </p>
                <p style={{ fontSize: "11px", color: "#A0A0A0", lineHeight: "1.3" }}>
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
                backgroundColor: "#1F1F1F",
                border: "1px solid #2A2A2A",
                borderRadius: "20px",
                padding: "6px 16px",
                fontSize: "12px",
                color: "#A0A0A0",
              }}
            >
              🎵 5 artistes · 30 morceaux · Guinée Conakry
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-6 text-center">
        <p className="text-xs" style={{ color: "#333333" }}>
          © 2026 SONAFRIK — Notre Bien Commun
        </p>
      </footer>
    </div>
  );
}
