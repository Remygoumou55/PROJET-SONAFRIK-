export default function AdminLoading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
      <div className="h-8 w-48 rounded-xl animate-pulse" style={{ backgroundColor: "#1F1F1F" }} />
      <div className="flex gap-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-8 w-24 rounded-full animate-pulse" style={{ backgroundColor: "#1F1F1F", animationDelay: `${i * 60}ms` }} />
        ))}
      </div>
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 w-full rounded-xl animate-pulse" style={{ backgroundColor: "#1F1F1F", animationDelay: `${i * 80}ms` }} />
        ))}
      </div>
    </div>
  );
}
