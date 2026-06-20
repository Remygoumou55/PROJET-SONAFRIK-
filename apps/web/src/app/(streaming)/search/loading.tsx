export default function SearchLoading() {
  return (
    <div className="p-6 max-w-3xl animate-pulse">
      <div className="h-8 w-32 rounded-lg mb-6" style={{ backgroundColor: "#1F1F1F" }} />
      <div className="h-12 w-full rounded-xl mb-6" style={{ backgroundColor: "#1F1F1F" }} />
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-14 rounded-lg" style={{ backgroundColor: "#1F1F1F", animationDelay: `${i * 50}ms` }} />
        ))}
      </div>
    </div>
  );
}
