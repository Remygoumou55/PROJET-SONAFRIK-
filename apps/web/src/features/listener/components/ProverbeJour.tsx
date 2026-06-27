import { getProverbeduJour } from "@/lib/proverbes";

export function ProverbeJour() {
  const proverbe = getProverbeduJour();

  return (
    <div className="proverbe-jour">
      <span className="proverbe-emoji" aria-hidden="true">
        🌍
      </span>
      <div className="proverbe-content">
        <p className="proverbe-text">&ldquo;{proverbe.text}&rdquo;</p>
        <p className="proverbe-source">
          — {proverbe.source}
          {proverbe.region ? ` · ${proverbe.region}` : ""}
        </p>
      </div>
    </div>
  );
}
