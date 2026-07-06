import { SkeletonRow } from "@/components/ui/SkeletonRow";

export default function NotificationsLoading() {
  return (
    <div className="p-6 max-w-2xl">
      <div className="h-8 w-40 rounded-lg mb-6 animate-pulse" style={{ backgroundColor: "var(--color-card)" }} />
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--color-card)" }}>
        {[...Array(5)].map((_, i) => (
          <SkeletonRow key={i} delayMs={i * 60} hasThumb />
        ))}
      </div>
    </div>
  );
}
