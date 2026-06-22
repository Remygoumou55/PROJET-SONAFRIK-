/** Skeleton d'une ligne titre+sous-titre (tendances, listes de morceaux). */
export function SkeletonRow({
  delayMs = 0,
  hasThumb = true,
}: {
  delayMs?: number;
  hasThumb?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 py-3 px-3" style={{ borderBottom: "1px solid var(--color-skeleton)" }}>
      {hasThumb && (
        <div
          className="w-10 h-10 rounded-xl flex-shrink-0 animate-pulse"
          style={{ backgroundColor: "var(--color-card)", animationDelay: `${delayMs}ms` }}
        />
      )}
      <div className="flex-1 space-y-2">
        <div
          className="h-3 rounded-full animate-pulse"
          style={{ backgroundColor: "var(--color-card)", width: "60%", animationDelay: `${delayMs}ms` }}
        />
        <div
          className="h-2.5 rounded-full animate-pulse"
          style={{ backgroundColor: "var(--color-surface)", width: "40%", animationDelay: `${delayMs + 40}ms` }}
        />
      </div>
      <div
        className="w-10 h-3 rounded-full animate-pulse flex-shrink-0"
        style={{ backgroundColor: "var(--color-card)", animationDelay: `${delayMs + 60}ms` }}
      />
    </div>
  );
}
