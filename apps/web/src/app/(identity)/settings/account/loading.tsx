export default function AccountSettingsLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
      <div className="h-5 w-40 rounded-lg animate-pulse" style={{ backgroundColor: "#1F1F1F" }} />
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "#1F1F1F" }}>
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="flex justify-between items-center px-5 py-4 border-b last:border-0 animate-pulse"
            style={{ borderColor: "#2A2A2A", animationDelay: `${i * 60}ms` }}
          >
            <div className="h-3.5 w-28 rounded" style={{ backgroundColor: "#2A2A2A" }} />
            <div className="h-3.5 w-36 rounded" style={{ backgroundColor: "#2A2A2A" }} />
          </div>
        ))}
      </div>
      <div className="h-10 w-full rounded-xl animate-pulse" style={{ backgroundColor: "#1F1F1F" }} />
    </div>
  );
}
