import { SkeletonCard } from "@/components/ui/SkeletonCard";

export default function BeatsLoading() {
  return (
    <div className="p-6 max-w-3xl animate-pulse">
      <div className="h-8 w-40 rounded-lg mb-6" style={{ backgroundColor: "var(--color-card)" }} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl p-4 flex flex-col gap-3"
            style={{ backgroundColor: "var(--color-card)" }}
          >
            <SkeletonCard size={160} delayMs={i * 60} />
            <div className="h-4 w-32 rounded" style={{ backgroundColor: "var(--color-elevated)" }} />
            <div className="h-3 w-20 rounded" style={{ backgroundColor: "var(--color-elevated)" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
