export default function CreatorIdentityLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Avatar + nom artiste */}
      <div className="flex items-center gap-4 p-5 rounded-2xl" style={{ backgroundColor: "#141414" }}>
        <div className="w-20 h-20 rounded-2xl animate-pulse flex-shrink-0" style={{ backgroundColor: "#1F1F1F" }} />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-40 rounded-lg animate-pulse" style={{ backgroundColor: "#1F1F1F" }} />
          <div className="h-3 w-24 rounded-lg animate-pulse" style={{ backgroundColor: "#1F1F1F", animationDelay: "60ms" }} />
          <div className="h-3 w-32 rounded-lg animate-pulse" style={{ backgroundColor: "#1F1F1F", animationDelay: "120ms" }} />
        </div>
      </div>
      {/* Form fields */}
      {[...Array(4)].map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-3 w-20 rounded animate-pulse" style={{ backgroundColor: "#1F1F1F", animationDelay: `${i * 60}ms` }} />
          <div className="h-11 w-full rounded-xl animate-pulse" style={{ backgroundColor: "#1F1F1F", animationDelay: `${i * 60 + 30}ms` }} />
        </div>
      ))}
      {/* Submit button */}
      <div className="h-11 w-32 rounded-xl animate-pulse" style={{ backgroundColor: "#1F1F1F", animationDelay: "280ms" }} />
    </div>
  );
}
