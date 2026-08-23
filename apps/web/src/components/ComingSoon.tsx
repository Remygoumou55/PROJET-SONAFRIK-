interface ComingSoonProps {
  title: string;
  description: string;
  emoji?: string;
}

export function ComingSoon({ title, description, emoji = "🔒" }: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-6">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
        style={{ backgroundColor: "var(--color-card)", border: "2px solid var(--color-bordure)" }}
      >
        <span className="text-3xl">{emoji}</span>
      </div>
      <h2 className="text-xl font-bold mb-2" style={{ color: "var(--color-texte-principal)" }}>{title}</h2>
      <p className="text-sm max-w-xs mb-6" style={{ color: "var(--color-texte-secondaire)" }}>{description}</p>
      <div
        className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
        style={{ backgroundColor: "rgba(69, 230, 255, 0.13)", color: "var(--color-or-solaire)", border: "1px solid rgba(69, 230, 255, 0.27)" }}
      >
        <span>🔒</span>
        <span>Bientôt disponible</span>
      </div>
    </div>
  );
}
