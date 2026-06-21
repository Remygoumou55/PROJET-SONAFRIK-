export default function NotificationsLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-3">
      <div className="h-5 w-36 rounded-lg animate-pulse" style={{ backgroundColor: "var(--color-card)" }} />
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-3 rounded-2xl p-4 animate-pulse"
          style={{ backgroundColor: "var(--color-card)", animationDelay: `${i * 60}ms` }}
        >
          <div className="w-10 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: "var(--color-elevated)" }} />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-40 rounded" style={{ backgroundColor: "var(--color-elevated)" }} />
            <div className="h-3 w-24 rounded" style={{ backgroundColor: "var(--color-elevated)" }} />
          </div>
        </div>
      ))}
    </div>
  );
}
