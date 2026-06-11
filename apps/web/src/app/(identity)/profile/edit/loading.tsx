export default function ProfileEditLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
      <div className="h-6 w-36 rounded-lg animate-pulse" style={{ backgroundColor: "#1F1F1F" }} />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="space-y-2" style={{ animationDelay: `${i * 50}ms` }}>
          <div className="h-3.5 w-24 rounded animate-pulse" style={{ backgroundColor: "#1F1F1F" }} />
          <div className="h-11 w-full rounded-xl animate-pulse" style={{ backgroundColor: "#1F1F1F" }} />
        </div>
      ))}
      <div className="h-10 w-full rounded-xl animate-pulse" style={{ backgroundColor: "#1F1F1F" }} />
    </div>
  );
}
