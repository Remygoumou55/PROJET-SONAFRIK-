export default function PaymentSettingsLoading() {
  return (
    <div className="space-y-4">
      {[0, 1].map((i) => (
        <div key={i} className="border-[var(--t8-border-default)] bg-[var(--t8-surface-03)] animate-pulse rounded-xl border p-6 space-y-3">
          <div className="bg-bordure h-4 w-32 rounded" />
          <div className="bg-bordure h-3 w-full rounded" />
          <div className="bg-bordure h-3 w-24 rounded" />
        </div>
      ))}
    </div>
  );
}
