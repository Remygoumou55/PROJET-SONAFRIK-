export default function RootLoading() {
  return (
    <div className="app-page-shell">
      <div className="app-page-main">
        <div className="app-page-content w-full max-w-sm px-4">
          <div className="flex flex-col items-center gap-6">
            <div className="h-12 w-12 animate-pulse rounded-2xl bg-card" />
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-16 w-full animate-pulse rounded-2xl bg-card"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
