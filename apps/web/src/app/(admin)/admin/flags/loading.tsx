export default function AdminFlagsLoading() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="h-8 w-40 rounded-lg" style={{ backgroundColor: "#1F1F1F" }} />
      <div className="space-y-3">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-16 rounded-xl flex items-center justify-between px-4" style={{ backgroundColor: "#1F1F1F", animationDelay: `${i * 50}ms` }}>
            <div className="h-4 w-40 rounded" style={{ backgroundColor: "#2A2A2A" }} />
            <div className="h-6 w-12 rounded-full" style={{ backgroundColor: "#2A2A2A" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
