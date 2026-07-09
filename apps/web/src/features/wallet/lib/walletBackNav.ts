import type { AccountType } from "@sonafrik/types";

export interface WalletBackNav {
  href: string;
  label: string;
  eyebrow: string;
}

/** Destination retour wallet selon le rôle utilisateur. */
export function resolveWalletBackNav(accountType: AccountType | null): WalletBackNav {
  if (accountType === "artiste" || accountType === "auditeur_artiste") {
    return {
      href: "/creator",
      label: "Retour à l'espace artiste",
      eyebrow: "ESPACE ARTISTE",
    };
  }

  return {
    href: "/listen",
    label: "Retour à l'écoute",
    eyebrow: "ESPACE AUDITEUR",
  };
}
