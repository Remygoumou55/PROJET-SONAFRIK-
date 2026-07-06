import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { SkeletonRow } from "@/components/ui/SkeletonRow";

export default function AlbumDetailLoading() {
  return (
    <div className="p-6 max-w-3xl">
      <div className="flex gap-5 mb-8 animate-pulse">
        <SkeletonCard size={144} />
        <div className="flex flex-col justify-end gap-2 flex-1">
          <div className="h-3 w-12 rounded" style={{ backgroundColor: "var(--color-elevated)" }} />
          <div className="h-6 w-48 rounded" style={{ backgroundColor: "var(--color-elevated)" }} />
          <div className="h-3 w-24 rounded" style={{ backgroundColor: "var(--color-elevated)" }} />
          <div className="h-3 w-16 rounded" style={{ backgroundColor: "var(--color-elevated)" }} />
        </div>
      </div>
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--color-card)" }}>
        {[...Array(5)].map((_, i) => (
          <SkeletonRow key={i} delayMs={i * 60} hasThumb={false} />
        ))}
      </div>
    </div>
  );
}
