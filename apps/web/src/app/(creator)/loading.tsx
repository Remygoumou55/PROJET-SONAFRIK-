export default function CreatorLoading() {
  return (
    <div
      className="min-h-dvh bg-noir-profond px-4 py-8"
      aria-busy="true"
      aria-label="Chargement de l'espace artiste"
    >
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-2xl bg-card"
              style={{ animationDelay: `${i * 80}ms` }}
            />
          ))}
        </div>
        <div className="flex gap-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-9 w-24 animate-pulse rounded-xl bg-card"
              style={{ animationDelay: `${i * 60}ms` }}
            />
          ))}
        </div>
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-16 w-full animate-pulse rounded-2xl bg-card"
            style={{ animationDelay: `${i * 80}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
