export default function AdminFinanceLoading() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="h-8 w-44 rounded-lg" style={{ backgroundColor: "#1F1F1F" }} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-28 rounded-xl" style={{ backgroundColor: "#1F1F1F" }} />
        ))}
      </div>
      <div className="space-y-3">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="h-12 rounded-lg" style={{ backgroundColor: "#1F1F1F", animationDelay: `${i * 40}ms` }} />
        ))}
      </div>
    </div>
  );
}
