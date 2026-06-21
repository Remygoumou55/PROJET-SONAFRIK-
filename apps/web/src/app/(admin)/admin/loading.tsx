export default function AdminLoading() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="h-8 w-48 rounded-lg" style={{ backgroundColor: "var(--color-card)" }} />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 rounded-xl" style={{ backgroundColor: "var(--color-card)" }} />
        ))}
      </div>
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 rounded-lg" style={{ backgroundColor: "var(--color-card)", animationDelay: `${i * 60}ms` }} />
        ))}
      </div>
    </div>
  );
}
