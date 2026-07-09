export default function RechargesLoading() {
  return (
    <div className="wallet-recharge-page">
      <header className="wallet-recharge-page__head">
        <div
          className="h-7 w-56 rounded animate-pulse mb-2"
          style={{ backgroundColor: "var(--color-elevated)" }}
        />
        <div
          className="h-3.5 w-72 max-w-full rounded animate-pulse"
          style={{ backgroundColor: "var(--color-elevated)" }}
        />
      </header>
      <div className="wallet-recharge-page__list" aria-busy="true">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="wallet-recharge-row wallet-recharge-row--skeleton animate-pulse"
            style={{ animationDelay: `${i * 60}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
