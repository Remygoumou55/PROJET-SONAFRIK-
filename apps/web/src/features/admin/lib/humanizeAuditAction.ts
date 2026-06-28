/** Traduit une action audit_logs en langage métier (zéro jargon technique). */
export function humanizeAuditAction(action: string, metadata: Record<string, unknown> | null): string {
  const a = action.toLowerCase();
  const entity = typeof metadata?.entity_type === "string" ? metadata.entity_type : "";

  if (a.includes("user") && a.includes("warn")) return "Avertissement envoyé à un auditeur";
  if (a.includes("user") && a.includes("suspend")) return "Compte auditeur suspendu";
  if (a.includes("user") && a.includes("delete")) return "Compte auditeur supprimé";
  if (a.includes("artist") && a.includes("verify")) return "Profil artiste vérifié";
  if (a.includes("creator") && a.includes("suspend")) return "Artiste suspendu";
  if (a.includes("withdraw")) return "Demande de retrait traitée";
  if (a.includes("payment") || a.includes("topup")) return "Paiement enregistré sur la plateforme";
  if (a.includes("catalog") || a.includes("publish")) return "Contenu musical publié";
  if (a.includes("reject")) return "Publication refusée après modération";
  if (a.includes("rights") || a.includes("claim")) return "Réclamation de droits reçue";
  if (a.includes("fraud")) return "Activité suspecte signalée";
  if (a.includes("royalty")) return "Cycle de revenus artistes lancé";
  if (a.includes("tier")) return "Niveau artiste mis à jour";
  if (a.includes("admin")) return "Action de gouvernance effectuée";
  if (entity === "track") return "Mise à jour d'un morceau";
  if (entity === "album") return "Mise à jour d'un album";
  if (entity === "profile") return "Mise à jour de profil";

  return action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
