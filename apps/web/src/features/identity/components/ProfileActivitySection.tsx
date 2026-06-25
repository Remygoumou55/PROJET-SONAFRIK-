import { formatDate, formatDateWithTime } from "@/lib/formatters";
import type { ProfileActivitySummary } from "../lib/profilePresentation";

interface ProfileActivitySectionProps {
  activity: ProfileActivitySummary;
  isArtist: boolean;
}

function ActivityItem({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="identity-activity-item">
      <p className="identity-activity-item__label">{label}</p>
      <p className="identity-activity-item__value">{value}</p>
      {hint ? <p className="identity-activity-item__hint">{hint}</p> : null}
    </div>
  );
}

export function ProfileActivitySection({ activity, isArtist }: ProfileActivitySectionProps) {
  const albumsValue =
    activity.publishedAlbums === null ? "—" : String(activity.publishedAlbums);
  const tracksValue =
    activity.publishedTracks === null ? "—" : String(activity.publishedTracks);

  return (
    <section className="identity-activity" aria-labelledby="profile-activity-title">
      <div className="identity-activity__header">
        <h2 id="profile-activity-title" className="identity-activity__title">
          Mon activité
        </h2>
        <p className="identity-activity__subtitle">
          Votre parcours sur SONAFRIK, en toute transparence.
        </p>
      </div>

      <div className="identity-activity__grid">
        <ActivityItem
          label="Membre depuis"
          value={formatDate(activity.memberSince)}
        />
        <ActivityItem
          label="Dernière connexion"
          value={
            activity.lastConnection
              ? formatDateWithTime(activity.lastConnection)
              : "—"
          }
        />
        {isArtist ? (
          <>
            <ActivityItem
              label="Sorties au catalogue"
              value={albumsValue}
              hint={activity.publishedAlbums === null ? "Disponible après votre premier upload" : undefined}
            />
            <ActivityItem
              label="Morceaux enregistrés"
              value={tracksValue}
              hint={activity.publishedTracks === null ? "Disponible après votre premier upload" : undefined}
            />
          </>
        ) : null}
        <ActivityItem label="Écoutes" value="Bientôt" hint="Statistiques en préparation" />
        {isArtist ? (
          <>
            <ActivityItem label="Revenus" value="Bientôt" hint="Après vos premières écoutes" />
            <ActivityItem label="Royalties" value="Bientôt" hint="Calculées chaque cycle" />
          </>
        ) : null}
      </div>
    </section>
  );
}
