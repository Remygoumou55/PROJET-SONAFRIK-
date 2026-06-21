export default function AdminCatalogLoading() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="h-8 w-40 rounded-lg" style={{ backgroundColor: "#1F1F1F" }} />
      <div className="h-10 w-full rounded-xl" style={{ backgroundColor: "#1F1F1F" }} />
      <div className="space-y-3">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-14 rounded-lg" style={{ backgroundColor: "#1F1F1F", animationDelay: `${i * 50}ms` }} />
        ))}
      </div>
    </div>
  );
}
