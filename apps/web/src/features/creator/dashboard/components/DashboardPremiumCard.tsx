import Link from "next/link";

export function DashboardPremiumCard() {
  return (
    <aside className="dash-premium" aria-label="SONAFRIK Premium">
      <div className="dash-premium__inner">
        <span className="dash-premium__icon" aria-hidden="true">👑</span>
        <div className="dash-premium__body">
          <p className="dash-premium__title">Boostez votre carrière avec SONAFRIK Premium</p>
          <p className="dash-premium__text">
            Accédez aux analytics avancées, aux outils de promotion et aux revenus prioritaires.
          </p>
        </div>
        <Link href="/wallet" className="dash-premium__cta">
          Découvrir →
        </Link>
      </div>
    </aside>
  );
}
