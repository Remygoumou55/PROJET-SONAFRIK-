export default function LancementLoading() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--color-noir-profond)", color: "var(--color-texte-principal)" }}
    >
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5">
        <div className="h-5 w-28 rounded-full animate-pulse" style={{ backgroundColor: "var(--color-card)" }} />
        <div className="h-8 w-28 rounded-full animate-pulse" style={{ backgroundColor: "var(--color-surface)", animationDelay: "60ms" }} />
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
        <div className="mb-10 w-full max-w-lg space-y-4">
          <div className="h-3 w-40 rounded-full animate-pulse mx-auto" style={{ backgroundColor: "var(--color-surface)" }} />
          <div className="h-10 w-3/4 rounded-xl animate-pulse mx-auto" style={{ backgroundColor: "var(--color-card)", animationDelay: "60ms" }} />
          <div className="h-10 w-1/2 rounded-xl animate-pulse mx-auto" style={{ backgroundColor: "var(--color-card)", animationDelay: "100ms" }} />
          <div className="h-4 w-4/5 rounded-full animate-pulse mx-auto" style={{ backgroundColor: "var(--color-surface)", animationDelay: "140ms" }} />
        </div>

        {/* Counter card skeleton */}
        <div
          className="w-full max-w-lg rounded-2xl p-8 mb-10"
          style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-elevated)" }}
        >
          <div className="h-3 w-48 rounded-full animate-pulse mb-6 mx-auto" style={{ backgroundColor: "var(--color-elevated)" }} />
          <div className="h-16 w-48 rounded-xl animate-pulse mb-6" style={{ backgroundColor: "var(--color-elevated)", animationDelay: "80ms" }} />
          <div className="h-2 w-full rounded-full animate-pulse" style={{ backgroundColor: "var(--color-elevated)", animationDelay: "120ms" }} />
          <div className="h-3 w-56 rounded-full animate-pulse mt-3 mx-auto" style={{ backgroundColor: "var(--color-surface)", animationDelay: "160ms" }} />
        </div>

        {/* CTA buttons */}
        <div className="flex gap-3 justify-center">
          <div className="h-11 w-44 rounded-full animate-pulse" style={{ backgroundColor: "var(--color-card)", animationDelay: "200ms" }} />
          <div className="h-11 w-48 rounded-full animate-pulse" style={{ backgroundColor: "var(--color-surface)", animationDelay: "240ms" }} />
        </div>
      </main>
    </div>
  );
}
