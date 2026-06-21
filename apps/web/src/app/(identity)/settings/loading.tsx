export default function SettingsLoading() {
  return (
    <div style={{ backgroundColor: "var(--color-noir-profond)", minHeight: "100%" }}>
      {/* Header */}
      <div className="px-6 pt-8 pb-6" style={{ borderBottom: "1px solid var(--color-surface)" }}>
        <div className="h-6 w-32 rounded-xl animate-pulse" style={{ backgroundColor: "var(--color-card)" }} />
      </div>

      {/* Settings groups */}
      {[0, 1, 2].map((group) => (
        <div key={group} className="px-6 pt-6">
          <div
            className="h-3 w-24 rounded-full animate-pulse mb-3"
            style={{ backgroundColor: "var(--color-surface)", animationDelay: `${group * 80}ms` }}
          />
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--color-elevated)" }}>
            {[0, 1, 2].map((row) => (
              <div
                key={row}
                className="flex items-center justify-between px-4 py-4 animate-pulse"
                style={{
                  borderBottom: row < 2 ? "1px solid var(--color-elevated)" : "none",
                  animationDelay: `${group * 80 + row * 40}ms`,
                }}
              >
                <div className="space-y-1.5">
                  <div className="h-3 w-32 rounded-full" style={{ backgroundColor: "var(--color-card)" }} />
                  <div className="h-2.5 w-20 rounded-full" style={{ backgroundColor: "var(--color-surface)" }} />
                </div>
                <div className="w-5 h-5 rounded-full" style={{ backgroundColor: "var(--color-elevated)" }} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
