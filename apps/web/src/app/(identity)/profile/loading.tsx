export default function ProfileLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="rounded-2xl p-6" style={{ backgroundColor: "#1F1F1F" }}>
        <div className="flex items-start gap-6 mb-6">
          <div className="w-20 h-20 rounded-full animate-pulse flex-shrink-0" style={{ backgroundColor: "#2A2A2A" }} />
          <div className="flex-1 space-y-3">
            <div className="h-5 w-48 rounded-lg animate-pulse" style={{ backgroundColor: "#2A2A2A" }} />
            <div className="h-3.5 w-32 rounded animate-pulse" style={{ backgroundColor: "#2A2A2A" }} />
            <div className="flex gap-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-5 w-16 rounded-full animate-pulse" style={{ backgroundColor: "#2A2A2A", animationDelay: `${i * 60}ms` }} />
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-8 w-28 rounded-xl animate-pulse" style={{ backgroundColor: "#2A2A2A", animationDelay: `${i * 80}ms` }} />
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 pt-6 border-t" style={{ borderColor: "#2A2A2A" }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 w-12 rounded animate-pulse" style={{ backgroundColor: "#2A2A2A" }} />
              <div className="h-4 w-20 rounded animate-pulse" style={{ backgroundColor: "#2A2A2A", animationDelay: `${i * 60}ms` }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
