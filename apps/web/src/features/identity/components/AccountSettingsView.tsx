import Link from "next/link";
import { buttonVariants } from "@sonafrik/ui";
import type { IdentityContext } from "@sonafrik/types";
import { formatDate } from "@/lib/formatters";
import { AccountDeletionPanel } from "./AccountDeletionPanel";
import {
  getAccountTypeLabel,
  getDisplayName,
  getSongLanguageLabel,
  isArtistAccount,
  maskPhoneNumber,
} from "../lib/profilePresentation";

interface AccountSettingsViewProps {
  context: IdentityContext;
}

export function AccountSettingsView({ context }: AccountSettingsViewProps) {
  const { profile } = context;
  const displayName = getDisplayName(profile);
  const isArtist = isArtistAccount(profile.account_type);
  const languageLabel =
    profile.preferred_language === "en" || profile.locale === "en" ? "Anglais" : "Français";

  return (
    <div className="identity-account">
      <section className="identity-account-intro" aria-labelledby="account-intro-title">
        <p className="identity-account-intro__eyebrow">Mon compte</p>
        <h2 id="account-intro-title" className="identity-account-intro__title">
          Bonjour, {displayName.split(" ")[0] ?? displayName}
        </h2>
        <p className="identity-account-intro__text">
          Retrouvez ici vos informations personnelles et gérez votre présence sur SONAFRIK.
        </p>
        <div className="identity-account-intro__actions">
          <Link href="/profile/edit" className={buttonVariants({ variant: "primary", size: "sm" })}>
            Modifier mon profil
          </Link>
          <Link href="/settings/sessions" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Sécurité
          </Link>
          <Link href="/settings/preferences" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Préférences
          </Link>
        </div>
      </section>

      <section className="identity-account-card" aria-labelledby="account-details-title">
        <h3 id="account-details-title" className="identity-account-card__title">
          Vos informations
        </h3>
        <dl className="identity-account-details">
          <Detail label="Nom affiché" value={displayName} />
          <Detail label="Téléphone" value={maskPhoneNumber(profile.phone)} />
          <Detail label="Email" value={profile.email ?? "Non renseigné"} />
          <Detail label="Email de secours" value={profile.backup_email ?? "Non renseigné"} />
          <Detail label="Langue" value={languageLabel} />
          <Detail label="Type de profil" value={getAccountTypeLabel(profile.account_type)} />
          <Detail label="Membre depuis" value={formatDate(profile.created_at)} />
          {isArtist && profile.main_genre ? (
            <Detail label="Genre musical" value={profile.main_genre} />
          ) : null}
          {isArtist && profile.song_language ? (
            <Detail
              label="Langue des chansons"
              value={getSongLanguageLabel(profile.song_language) ?? profile.song_language}
            />
          ) : null}
          {isArtist && profile.origin_region ? (
            <Detail label="Région d'origine" value={profile.origin_region} />
          ) : null}
        </dl>
        <p className="identity-account-card__note">
          Pour modifier votre numéro de téléphone, contactez{" "}
          <a href="mailto:support@sonafrik.com" className="identity-account-link">
            support@sonafrik.com
          </a>
          .
        </p>
      </section>

      <AccountDeletionPanel />
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="identity-account-detail">
      <dt className="identity-account-detail__label">{label}</dt>
      <dd className="identity-account-detail__value">{value}</dd>
    </div>
  );
}
