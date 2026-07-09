// Rôle de navigation — distinct de @sonafrik/types UserRole (valeurs françaises)
export type RouteRole = "listener" | "artist" | "superadmin" | null;

export function mapAccountType(
  accountType: string | null | undefined,
): RouteRole {
  switch (accountType) {
    case "auditeur":
      return "listener";
    case "artiste":
    case "auditeur_artiste":
      return "artist";
    default:
      return null;
  }
}
