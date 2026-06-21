import { SkeletonRow } from "@/components/ui/SkeletonRow";
import { SkeletonCard } from "@/components/ui/SkeletonCard";

export default function CatalogLoading() {
  return (
    <div style={{ backgroundColor: "var(--color-noir-profond)", minHeight: "100%" }}>
      {/* Header */}
      <div className="px-6 pt-8 pb-4" style={{ borderBottom: "1px solid var(--color-surface)" }}>
        <div className="h-6 w-36 rounded-xl animate-pulse mb-2" style={{ backgroundColor: "var(--color-card)" }} />
        <div className="h-3 w-24 rounded-full animate-pulse" style={{ backgroundColor: "var(--color-surface)", animationDelay: "40ms" }} />
      </div>

      {/* Albums row */}
      <div className="px-6 pt-6 pb-4">
        <div className="h-4 w-28 rounded-full animate-pulse mb-3" style={{ backgroundColor: "var(--color-card)" }} />
        <div className="flex gap-3 overflow-hidden">
          {[0, 1, 2].map((i) => (
            <SkeletonCard key={i} size={110} delayMs={i * 50} />
          ))}
        </div>
      </div>

      {/* Tracks list */}
      <div className="px-6 mb-2 mt-2">
        <div className="h-4 w-28 rounded-full animate-pulse" style={{ backgroundColor: "var(--color-card)" }} />
      </div>
      <div>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <SkeletonRow key={i} delayMs={i * 40} hasThumb />
        ))}
      </div>
    </div>
  );
}
