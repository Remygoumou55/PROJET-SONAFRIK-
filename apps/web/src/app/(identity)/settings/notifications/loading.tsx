export default function NotificationsLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-3">
      <div className="h-5 w-36 rounded-lg animate-pulse" style={{ backgroundColor: "#1F1F1F" }} />
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-3 rounded-2xl p-4 animate-pulse"
          style={{ backgroundColor: "#1F1F1F", animationDelay: `${i * 60}ms` }}
        >
          <div className="w-10 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: "#2A2A2A" }} />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-40 rounded" style={{ backgroundColor: "#2A2A2A" }} />
            <div className="h-3 w-24 rounded" style={{ backgroundColor: "#2A2A2A" }} />
          </div>
        </div>
      ))}
    </div>
  );
}
