export default function AdminHealthLoading() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="h-8 w-32 rounded-lg" style={{ backgroundColor: "#1F1F1F" }} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl" style={{ backgroundColor: "#1F1F1F", animationDelay: `${i * 50}ms` }} />
        ))}
      </div>
    </div>
  );
}
