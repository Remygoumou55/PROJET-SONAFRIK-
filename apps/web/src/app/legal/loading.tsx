export default function LegalLoading() {
  return (
    <div className="min-h-dvh px-6 py-12 max-w-3xl mx-auto animate-pulse" aria-busy="true" aria-label="Chargement">
      <div className="h-9 w-1/2 rounded-lg mb-8" style={{ backgroundColor: "var(--color-card)" }} />
      <div className="space-y-3">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="h-3 rounded"
            style={{ backgroundColor: "var(--color-card)", width: `${70 + (i % 3) * 10}%` }}
          />
        ))}
      </div>
    </div>
  );
}
