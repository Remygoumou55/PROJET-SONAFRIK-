import Link from "next/link";
import { Avatar, Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@sonafrik/ui";
import type { IdentityContext } from "@sonafrik/types";
import { ACCOUNT_TYPE_OPTIONS } from "@sonafrik/types";

interface ProfileHeaderProps {
  context: IdentityContext;
  avatarUrl?: string | null;
}

export function ProfileHeader({ context, avatarUrl }: ProfileHeaderProps) {
  const { profile, roles, unreadNotifications, activeSessions } = context;
  const displayName = profile.full_name ?? profile.phone ?? "Utilisateur SONAFRIK";
  const accountLabel =
    ACCOUNT_TYPE_OPTIONS.find((option) => option.value === profile.account_type)?.label ??
    "Auditeur";

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start gap-6">
          <Avatar
            size="2xl"
            src={avatarUrl ?? undefined}
            alt={displayName}
            fallback={displayName}
          />
          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <CardTitle className="text-xl">{displayName}</CardTitle>
              <p className="text-texte-secondaire mt-1 text-sm">
                {profile.city ?? "Conakry"} · {profile.country_code ?? "GN"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {accountLabel ? <Badge variant="default">{accountLabel}</Badge> : null}
              {profile.account_type === "artiste" || profile.account_type === "auditeur_artiste" ? (
                <Badge variant="premium">Creator OS</Badge>
              ) : null}
              {roles.map((role) => (
                <Badge key={role} variant="outline">
                  {role.replace("_", " ")}
                </Badge>
              ))}
              {unreadNotifications > 0 ? (
                <Badge variant="primary">{unreadNotifications} non lues</Badge>
              ) : null}
              <Badge variant="outline">{activeSessions} session(s) active(s)</Badge>
            </div>
            {profile.bio ? (
              <p className="text-texte-secondaire text-sm leading-relaxed">{profile.bio}</p>
            ) : (
              <p className="text-texte-desactive text-sm italic">Aucune bio pour le moment.</p>
            )}
            <div className="flex flex-wrap gap-3 pt-1">
              <Button asChild size="sm">
                <Link href="/profile/edit">Modifier le profil</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/settings">Paramètres</Link>
              </Button>
              {profile.account_type === "artiste" || profile.account_type === "auditeur_artiste" ? (
                <Button asChild variant="premium" size="sm">
                  <Link href="/creator">Espace créateur</Link>
                </Button>
              ) : null}
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 border-t border-bordure pt-6 sm:grid-cols-3">
          <Stat label="Langue" value={profile.locale === "en" ? "English" : "Français"} />
          <Stat label="Visibilité" value={context.preferences.profile_visibility} />
          <Stat label="Membre depuis" value={formatDate(profile.created_at)} />
        </CardContent>
      </Card>

      {/* GAP D-3.0 : updateAccountType absent de updateProfileSchema et ensureCreator()
          requiert is_artist_account RPC → impossible sans nouvelle RPC SQL */}
      {profile.account_type === "auditeur" && (
        <div
          className="mt-6 rounded-2xl overflow-hidden"
          style={{ border: "1px solid #FFC20E25", background: "#0D0D0D" }}
        >
          <div
            className="px-6 py-4 flex items-center gap-3"
            style={{
              background: "linear-gradient(90deg, #FFC20E0D 0%, transparent 100%)",
              borderBottom: "1px solid #1A1A1A",
            }}
          >
            <svg width={18} height={18} viewBox="0 0 24 24" fill="#FFC20E">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
            <h3 className="font-bold text-sm" style={{ color: "#FFC20E" }}>
              Devenir artiste sur SONAFRIK
            </h3>
          </div>
          <div className="px-6 py-4">
            <p className="text-sm mb-3" style={{ color: "#CCCCCC" }}>
              Partagez votre musique africaine avec le monde. Le Creator OS vous donne accès
              à la gestion de votre catalogue, vos analytics et vos royalties.
            </p>
            <p className="text-xs px-3 py-2 rounded-lg" style={{ background: "#1A1A1A", color: "#666666" }}>
              La mise à niveau vers un compte artiste est actuellement gérée par notre équipe.
              Contactez le support pour démarrer votre espace créateur.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-texte-desactive text-xs uppercase tracking-wide">{label}</p>
      <p className="text-texte-principal mt-1 text-sm font-medium capitalize">{value}</p>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(
    new Date(iso),
  );
}
