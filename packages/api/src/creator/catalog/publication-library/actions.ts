import type { PublicationStatus } from "@sonafrik/types";

export type PublicationActionId =
  | "view"
  | "edit"
  | "continue"
  | "duplicate"
  | "share"
  | "analytics"
  | "revenue"
  | "withdraw"
  | "archive"
  | "delete"
  | "consult"
  | "correct"
  | "resubmit";

export interface PublicationActionDef {
  id: PublicationActionId;
  label: string;
  variant: "primary" | "outline";
}

export interface PublicationMenuAction {
  id: PublicationActionId;
  label: string;
  disabled?: boolean;
  destructive?: boolean;
}

const ACTION_MATRIX: Record<PublicationStatus, PublicationActionDef[]> = {
  draft: [
    { id: "edit", label: "Modifier", variant: "primary" },
    { id: "continue", label: "Continuer", variant: "outline" },
    { id: "delete", label: "Supprimer", variant: "outline" },
  ],
  pending_review: [{ id: "view", label: "Voir", variant: "outline" }],
  published: [
    { id: "view", label: "Voir", variant: "outline" },
    { id: "share", label: "Partager", variant: "outline" },
    { id: "consult", label: "Consulter", variant: "primary" },
  ],
  rejected: [
    { id: "view", label: "Voir", variant: "outline" },
    { id: "correct", label: "Corriger", variant: "primary" },
    { id: "resubmit", label: "Renvoyer", variant: "outline" },
  ],
  archived: [{ id: "view", label: "Voir", variant: "outline" }],
};

/**
 * Menu ligne — uniquement actions réellement disponibles.
 * Pas d’entrées fantômes disabled (dupliquer/retirer/archiver) tant que non implémentées.
 */
const MENU_MATRIX: Record<PublicationStatus, PublicationMenuAction[]> = {
  draft: [
    { id: "view", label: "Voir" },
    { id: "edit", label: "Modifier" },
    { id: "continue", label: "Continuer la publication" },
    { id: "delete", label: "Supprimer", destructive: true },
  ],
  pending_review: [{ id: "view", label: "Voir" }],
  published: [
    { id: "view", label: "Voir" },
    { id: "share", label: "Partager" },
    { id: "consult", label: "Consulter" },
    { id: "analytics", label: "Voir Analytics" },
    { id: "revenue", label: "Voir Revenus" },
  ],
  rejected: [
    { id: "view", label: "Voir" },
    { id: "correct", label: "Corriger" },
    { id: "resubmit", label: "Renvoyer" },
    { id: "delete", label: "Supprimer", destructive: true },
  ],
  archived: [
    { id: "view", label: "Voir" },
    { id: "delete", label: "Supprimer", destructive: true },
  ],
};

export function getPublicationActions(status: PublicationStatus): PublicationActionDef[] {
  return ACTION_MATRIX[status] ?? [{ id: "view", label: "Voir", variant: "outline" }];
}

export function getPublicationMenuActions(status: PublicationStatus): PublicationMenuAction[] {
  return MENU_MATRIX[status] ?? [{ id: "view", label: "Voir" }];
}

export function getPublicationEditHref(trackId: string): string {
  return `/creator/catalog/tracks/${trackId}/edit`;
}

export function getPublicationConsultHref(trackId: string): string {
  return `/creator/catalog/tracks/${trackId}`;
}

export function getPublicationCoverHref(trackId: string): string {
  return `/creator/catalog/tracks/${trackId}/edit#cover`;
}

export function getPublicationContinueHref(trackId: string): string {
  return getPublicationEditHref(trackId);
}

export function getPublicationResubmitHref(trackId: string): string {
  return `${getPublicationEditHref(trackId)}#publish`;
}

export function getPublicationAnalyticsHref(): string {
  return "/creator/analytics";
}

export function getPublicationRevenueHref(): string {
  return "/wallet/royalties";
}
