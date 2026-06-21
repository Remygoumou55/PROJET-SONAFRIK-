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
        style={{ backgroundColor: "#1F1F1F", border: "2px solid #333333" }}
      >
        <span className="text-3xl">{emoji}</span>
      </div>
      <h2 className="text-xl font-bold mb-2" style={{ color: "#FFFFFF" }}>{title}</h2>
      <p className="text-sm max-w-xs mb-6" style={{ color: "#A0A0A0" }}>{description}</p>
      <div
        className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
        style={{ backgroundColor: "#FFC20E22", color: "#FFC20E", border: "1px solid #FFC20E44" }}
      >
        <span>🔒</span>
        <span>Bientôt disponible</span>
      </div>
    </div>
  );
}
