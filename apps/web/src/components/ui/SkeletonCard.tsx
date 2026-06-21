/** Skeleton d'une carte album/morceau (carrée, 128×128 ou taille personnalisée). */
export function SkeletonCard({
  size = 128,
  delayMs = 0,
}: {
  size?: number;
  delayMs?: number;
}) {
  return (
    <div
      className="rounded-2xl flex-shrink-0 animate-pulse"
      style={{
        width:            size,
        height:           size,
        backgroundColor:  "var(--color-card)",
        animationDelay:   `${delayMs}ms`,
      }}
    />
  );
}
