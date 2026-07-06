import { SkeletonRow } from "@/components/ui/SkeletonRow";

export default function LibraryLoading() {
  return (
    <div className="p-6 max-w-3xl">
      <div className="h-8 w-32 rounded-lg mb-6 animate-pulse" style={{ backgroundColor: "var(--color-card)" }} />
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--color-card)" }}>
        {[...Array(8)].map((_, i) => (
          <SkeletonRow key={i} delayMs={i * 50} hasThumb />
        ))}
      </div>
    </div>
  );
}
