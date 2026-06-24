export default function NotificationsLoading() {
  return (
    <div className="p-6 max-w-2xl animate-pulse">
      <div className="h-8 w-40 rounded-lg mb-6" style={{ backgroundColor: "var(--color-card)" }} />
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-start gap-3 p-4 rounded-xl" style={{ backgroundColor: "var(--color-card)", animationDelay: `${i * 60}ms` }}>
            <div className="w-10 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: "var(--color-elevated)" }} />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-3/4 rounded" style={{ backgroundColor: "var(--color-elevated)" }} />
              <div className="h-2 w-1/2 rounded" style={{ backgroundColor: "var(--color-elevated)" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
