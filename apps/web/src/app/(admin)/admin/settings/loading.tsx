export default function AdminSettingsLoading() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="h-8 w-44 rounded-lg" style={{ backgroundColor: "#1F1F1F" }} />
      <div className="space-y-3">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-16 rounded-xl flex items-center justify-between px-4" style={{ backgroundColor: "#1F1F1F", animationDelay: `${i * 50}ms` }}>
            <div className="space-y-1">
              <div className="h-3 w-32 rounded" style={{ backgroundColor: "#2A2A2A" }} />
              <div className="h-3 w-20 rounded" style={{ backgroundColor: "#2A2A2A" }} />
            </div>
            <div className="h-8 w-24 rounded-lg" style={{ backgroundColor: "#2A2A2A" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
