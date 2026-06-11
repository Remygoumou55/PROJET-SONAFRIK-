export default function PreferencesLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
      {[...Array(3)].map((_, section) => (
        <div key={section} className="rounded-2xl overflow-hidden" style={{ backgroundColor: "#1F1F1F", animationDelay: `${section * 100}ms` }}>
          <div className="px-5 py-3 border-b" style={{ borderColor: "#2A2A2A" }}>
            <div className="h-3.5 w-32 rounded animate-pulse" style={{ backgroundColor: "#2A2A2A" }} />
          </div>
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="flex justify-between items-center px-5 py-4 border-b last:border-0 animate-pulse"
              style={{ borderColor: "#2A2A2A", animationDelay: `${(section * 3 + i) * 50}ms` }}
            >
              <div className="h-3.5 w-36 rounded" style={{ backgroundColor: "#2A2A2A" }} />
              <div className="h-6 w-10 rounded-full" style={{ backgroundColor: "#2A2A2A" }} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
