export default function AdminFraudLoading() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="h-8 w-36 rounded-lg" style={{ backgroundColor: "#1F1F1F" }} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-24 rounded-xl" style={{ backgroundColor: "#1F1F1F" }} />
        ))}
      </div>
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-12 rounded-lg" style={{ backgroundColor: "#1F1F1F", animationDelay: `${i * 60}ms` }} />
        ))}
      </div>
    </div>
  );
}
