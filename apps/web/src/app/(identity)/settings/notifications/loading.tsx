import { SkeletonRow } from "@/components/ui/SkeletonRow";

export default function NotificationsLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="h-5 w-36 rounded-lg mb-4 animate-pulse" style={{ backgroundColor: "var(--color-card)" }} />
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--color-card)" }}>
        {[...Array(6)].map((_, i) => (
          <SkeletonRow key={i} delayMs={i * 60} hasThumb />
        ))}
      </div>
    </div>
  );
}
