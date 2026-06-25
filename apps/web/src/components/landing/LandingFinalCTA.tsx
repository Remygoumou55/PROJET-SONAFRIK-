import Link from "next/link";

export function LandingFinalCTA() {
  return (
    <div className="mb-12 rounded-[14px] border border-white/10 bg-white/[0.03] p-12 text-center">
      <h2 className="mb-3 text-[28px] font-semibold text-texte-principal">Votre place est ici.</h2>
      <p className="mx-auto mb-7 max-w-[500px] text-[15px] leading-relaxed text-white/45">
        Chaque abonné fait avancer le compteur. Ensemble, on débloque le lancement et on change
        comment la musique guinéenne est valorisée.
      </p>

      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/auth/connexion"
          className="inline-block rounded-lg bg-vert-energie px-7 py-3.5 text-[15px] font-semibold text-noir-profond no-underline"
        >
          Rejoindre maintenant →
        </Link>
        <Link
          href="/lancement"
          className="inline-block rounded-lg border border-white/20 bg-transparent px-7 py-3.5 text-[15px] font-medium text-texte-principal no-underline"
        >
          En savoir plus
        </Link>
      </div>
    </div>
  );
}
