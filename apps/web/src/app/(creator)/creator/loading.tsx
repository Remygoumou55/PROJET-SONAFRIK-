import { SkeletonRow } from "@/components/ui/SkeletonRow";

export default function CreatorLoading() {
  return (
    <div style={{ backgroundColor: "var(--color-noir-profond)", minHeight: "100%" }}>
      {/* Header */}
      <div className="px-6 pt-8 pb-6" style={{ borderBottom: "1px solid var(--color-surface)" }}>
        <div className="h-3 w-24 rounded-full animate-pulse mb-3" style={{ backgroundColor: "var(--color-card)" }} />
        <div className="h-7 w-52 rounded-xl animate-pulse mb-2" style={{ backgroundColor: "var(--color-card)" }} />
        <div className="h-3 w-40 rounded-full animate-pulse" style={{ backgroundColor: "var(--color-surface)", animationDelay: "60ms" }} />
      </div>

      {/* Stats cards */}
      <div className="px-6 py-6 grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl p-4 animate-pulse"
            style={{ backgroundColor: "var(--color-card)", animationDelay: `${i * 60}ms`, height: "80px" }}
          />
        ))}
      </div>

      {/* Recent tracks */}
      <div className="px-6 mb-2">
        <div className="h-4 w-32 rounded-full animate-pulse" style={{ backgroundColor: "var(--color-card)" }} />
      </div>
      <div>
        {[0, 1, 2, 3, 4].map((i) => (
          <SkeletonRow key={i} delayMs={i * 50} hasThumb />
        ))}
      </div>
    </div>
  );
}
