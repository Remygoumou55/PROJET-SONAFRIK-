export default function PayoutLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-4 w-40 rounded animate-pulse" style={{ backgroundColor: "#1F1F1F" }} />
        <div className="h-8 w-24 rounded-lg animate-pulse" style={{ backgroundColor: "#1F1F1F" }} />
      </div>
      {[...Array(2)].map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between rounded-xl p-4 animate-pulse"
          style={{ backgroundColor: "#1F1F1F", animationDelay: `${i * 80}ms` }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: "#2A2A2A" }} />
            <div className="space-y-1.5">
              <div className="h-3.5 w-32 rounded" style={{ backgroundColor: "#2A2A2A" }} />
              <div className="h-3 w-20 rounded" style={{ backgroundColor: "#2A2A2A" }} />
            </div>
          </div>
          <div className="h-5 w-5 rounded" style={{ backgroundColor: "#2A2A2A" }} />
        </div>
      ))}
      <div className="h-px w-full" style={{ backgroundColor: "#1F1F1F" }} />
      <div className="h-4 w-44 rounded animate-pulse" style={{ backgroundColor: "#1F1F1F" }} />
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between rounded-xl p-4 animate-pulse"
          style={{ backgroundColor: "#1F1F1F", animationDelay: `${i * 70}ms` }}
        >
          <div className="space-y-1.5">
            <div className="h-3.5 w-28 rounded" style={{ backgroundColor: "#2A2A2A" }} />
            <div className="h-3 w-20 rounded" style={{ backgroundColor: "#2A2A2A" }} />
          </div>
          <div className="h-6 w-16 rounded-full" style={{ backgroundColor: "#2A2A2A" }} />
        </div>
      ))}
    </div>
  );
}
