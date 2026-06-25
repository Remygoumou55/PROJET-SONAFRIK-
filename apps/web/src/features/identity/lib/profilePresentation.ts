import type { AccountType, Profile, UserRole } from "@sonafrik/types";
import { ACCOUNT_TYPE_OPTIONS } from "@sonafrik/types";

const SONG_LANGUAGE_LABELS: Record<string, string> = {
  fr: "Français",
  ss: "Soussou",
  ff: "Pular",
  man: "Malinké",
  multi: "Plusieurs langues",
};

export function isArtistAccount(accountType: AccountType | null): boolean {
  return accountType === "artiste" || accountType === "auditeur_artiste";
}

export function getDisplayName(profile: Profile): string {
  if (isArtistAccount(profile.account_type) && profile.stage_name?.trim()) {
    return profile.stage_name.trim();
  }
  return profile.full_name?.trim() || profile.phone || "Membre SONAFRIK";
}

export function getAccountTypeLabel(accountType: AccountType | null): string {
  return (
    ACCOUNT_TYPE_OPTIONS.find((option) => option.value === accountType)?.label ?? "Membre"
  );
}

export function getSongLanguageLabel(code: string | null): string | null {
  if (!code) return null;
  return SONG_LANGUAGE_LABELS[code] ?? code;
}

export function humanizeVisibility(value: string): string {
  if (value === "public") return "Profil public";
  if (value === "private") return "Profil privé";
  return value;
}

export function humanizeRole(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    auditeur: "Auditeur",
    artiste: "Artiste",
    auditeur_artiste: "Auditeur & Artiste",
    admin: "Équipe SONAFRIK",
  };
  return labels[role] ?? role;
}

export function computeProfileCompletion(profile: Profile): number {
  const isArtist = isArtistAccount(profile.account_type);
  const checks = isArtist
    ? [
        !!(profile.stage_name || profile.full_name),
        !!profile.bio?.trim(),
        !!profile.city?.trim(),
        !!(profile.avatar_url || profile.avatar_path),
        !!profile.main_genre?.trim(),
        !!profile.origin_region?.trim(),
      ]
    : [
        !!profile.full_name?.trim(),
        !!profile.bio?.trim(),
        !!profile.city?.trim(),
        !!(profile.avatar_url || profile.avatar_path),
      ];

  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
}

export interface ProfileActivitySummary {
  memberSince: string;
  lastConnection: string | null;
  publishedAlbums: number | null;
  publishedTracks: number | null;
}

/** Masque un numéro guinéen pour affichage : +22462 .. .. 07 */
export function maskPhoneNumber(phone: string | null): string {
  if (!phone?.trim()) return "—";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8) return phone;
  const prefix = phone.startsWith("+") ? `+${digits.slice(0, 5)}` : digits.slice(0, 5);
  const suffix = digits.slice(-2);
  return `${prefix} .. .. ${suffix}`;
}
