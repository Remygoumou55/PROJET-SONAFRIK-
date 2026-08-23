export default function AuthLoading() {
  return (
    <div className="app-page-content w-full max-w-sm px-6">
      <div className="flex flex-col items-center gap-5">
        <div className="h-8 w-32 animate-pulse rounded-lg bg-[var(--t8-surface-02)]" />
        <div className="w-full space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-12 w-full animate-pulse rounded-xl bg-[var(--t8-surface-02)]"
              style={{ animationDelay: `${i * 80}ms` }}
            />
          ))}
        </div>
        <div className="h-12 w-full animate-pulse rounded-xl bg-[var(--t8-primary-lavender)]/15" />
      </div>
    </div>
  );
}
