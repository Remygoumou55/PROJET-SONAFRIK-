import Link from "next/link";
import type { Metadata } from "next";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { LaunchCounter } from "@/features/launch/components/LaunchCounter";
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
          <LaunchCounter {...progress} />
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
            href="/listen"
            className="rounded-full px-8 py-3 text-sm font-medium transition-opacity hover:opacity-80"
            style={{ backgroundColor: "#1A1A1A", color: "#FFFFFF", border: "1px solid #2A2A2A" }}
          >
            Découvrir la musique
          </Link>
        </div>

        {/* Règles CDC */}
        <div className="mt-16 grid gap-4 sm:grid-cols-3 max-w-2xl w-full text-left">
          {[
            { rule: "#3", label: "65% reversés aux artistes", icon: "🎵" },
            { rule: "#4", label: "Beat Store à 0% de commission", icon: "🎹" },
            { rule: "#5", label: "Pourboires avec 5% de frais", icon: "💸" },
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
