import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { SkeletonRow }  from "@/components/ui/SkeletonRow";

export default function ListenLoading() {
  return (
    <div style={{ backgroundColor: "#0A0A0A", minHeight: "100%" }}>
      {/* Hero skeleton */}
      <div
        className="px-6 pt-8 pb-10"
        style={{ borderBottom: "1px solid #1A1A1A", background: "linear-gradient(to bottom, #111111, #0A0A0A)" }}
      >
        <div className="flex items-start justify-between mb-6">
          <div className="space-y-2">
            <div className="h-3 w-16 rounded-full animate-pulse" style={{ backgroundColor: "#1F1F1F" }} />
            <div className="h-7 w-48 rounded-xl animate-pulse" style={{ backgroundColor: "#1F1F1F" }} />
            <div className="h-3 w-36 rounded-full animate-pulse" style={{ backgroundColor: "#1F1F1F", animationDelay: "80ms" }} />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full animate-pulse" style={{ backgroundColor: "#1F1F1F" }} />
            <div className="w-10 h-10 rounded-full animate-pulse" style={{ backgroundColor: "#1F1F1F" }} />
          </div>
        </div>
        <div className="h-12 w-full rounded-2xl animate-pulse" style={{ backgroundColor: "#1F1F1F", animationDelay: "120ms" }} />
      </div>

      {/* Sections : cartes + lignes tendances */}
      <div className="pb-8 mt-8 space-y-10">
        {/* Section cartes (découvertes) */}
        {[0, 1].map((i) => (
          <div key={i} className="px-6 space-y-3">
            <div
              className="h-4 w-28 rounded-full animate-pulse"
              style={{ backgroundColor: "#1F1F1F", animationDelay: `${i * 80}ms` }}
            />
            <div className="flex gap-3 overflow-hidden">
              {[0, 1, 2, 3].map((j) => (
                <SkeletonCard key={j} size={128} delayMs={i * 160 + j * 40} />
              ))}
            </div>
          </div>
        ))}

        {/* Section tendances (lignes) */}
        <div className="px-6 space-y-1">
          <div className="h-4 w-28 rounded-full animate-pulse mb-3" style={{ backgroundColor: "#1F1F1F" }} />
          {[0, 1, 2, 3, 4].map((i) => (
            <SkeletonRow key={i} delayMs={i * 50} hasThumb />
          ))}
        </div>
      </div>
    </div>
  );
}
