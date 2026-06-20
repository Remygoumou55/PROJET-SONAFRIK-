export default function BeatsLoading() {
  return (
    <div className="p-6 max-w-3xl animate-pulse">
      <div className="h-8 w-40 rounded-lg mb-6" style={{ backgroundColor: "#1F1F1F" }} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-xl p-4" style={{ backgroundColor: "#1F1F1F", animationDelay: `${i * 60}ms` }}>
            <div className="aspect-square rounded-lg mb-3" style={{ backgroundColor: "#2A2A2A" }} />
            <div className="h-4 w-32 rounded mb-2" style={{ backgroundColor: "#2A2A2A" }} />
            <div className="h-3 w-20 rounded" style={{ backgroundColor: "#2A2A2A" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
