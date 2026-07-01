import Link from "next/link";

interface Props {
  tracksPublished: number;
  followersValue: string;
}

export function DashboardQuickCards({ tracksPublished, followersValue }: Props) {
  return (
    <section className="dash-quick-cards" aria-label="Accès rapide">
      <Link href="/creator/identity" className="dash-quick-card">
        <span className="dash-quick-card__icon" aria-hidden="true">👤</span>
        <p className="dash-quick-card__label">Mon Profil</p>
        <p className="dash-quick-card__arrow" aria-hidden="true">→</p>
      </Link>

      <Link href="/creator/catalog" className="dash-quick-card">
        <span className="dash-quick-card__icon" aria-hidden="true">🎵</span>
        <p className="dash-quick-card__label">Mon Catalogue</p>
        <p className="dash-quick-card__value">{tracksPublished} titre{tracksPublished !== 1 ? "s" : ""}</p>
      </Link>

      <div className="dash-quick-card">
        <span className="dash-quick-card__icon" aria-hidden="true">👥</span>
        <p className="dash-quick-card__label">Followers</p>
        <p className="dash-quick-card__value">{followersValue}</p>
      </div>
    </section>
  );
}
