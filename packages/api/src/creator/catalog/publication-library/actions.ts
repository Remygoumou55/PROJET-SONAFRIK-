import type { PublicationStatus } from "@sonafrik/types";

export type PublicationActionId =
  | "view"
  | "edit"
  | "continue"
  | "delete"
  | "share"
  | "consult"
  | "correct"
  | "resubmit";

export interface PublicationActionDef {
  id: PublicationActionId;
  label: string;
  variant: "primary" | "outline";
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

export function getPublicationActions(status: PublicationStatus): PublicationActionDef[] {
  return ACTION_MATRIX[status] ?? [{ id: "view", label: "Voir", variant: "outline" }];
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
