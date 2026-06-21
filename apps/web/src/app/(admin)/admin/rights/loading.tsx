export default function AdminRightsLoading() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="h-8 w-36 rounded-lg" style={{ backgroundColor: "var(--color-card)" }} />
      <div className="h-10 w-full rounded-xl" style={{ backgroundColor: "var(--color-card)" }} />
      <div className="space-y-3">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="h-14 rounded-lg" style={{ backgroundColor: "var(--color-card)", animationDelay: `${i * 50}ms` }} />
        ))}
      </div>
    </div>
  );
}
