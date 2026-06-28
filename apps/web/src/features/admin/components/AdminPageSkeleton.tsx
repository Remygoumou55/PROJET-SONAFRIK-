export type AdminPageSkeletonVariant = "list" | "grid" | "cards";

interface AdminPageSkeletonProps {
  variant?: AdminPageSkeletonVariant;
  rows?: number;
}

/** Skeleton de chargement unifié pour toutes les pages admin. */
export function AdminPageSkeleton({ variant = "list", rows = 8 }: AdminPageSkeletonProps) {
  return (
    <div className="admin-page-skeleton" aria-hidden="true">
      <div className="admin-page-skeleton__title admin-skeleton-block" />
      <div className="admin-page-skeleton__toolbar admin-skeleton-block" />

      {variant === "grid" ? (
        <div className="admin-page-skeleton__grid">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="admin-page-skeleton__card admin-skeleton-block" />
          ))}
        </div>
      ) : null}

      {variant === "cards" ? (
        <div className="admin-page-skeleton__cards">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="admin-page-skeleton__metric admin-skeleton-block" />
          ))}
        </div>
      ) : null}

      <div className="admin-page-skeleton__rows">
        {[...Array(rows)].map((_, i) => (
          <div
            key={i}
            className="admin-page-skeleton__row admin-skeleton-block"
            style={{ animationDelay: `${i * 50}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
