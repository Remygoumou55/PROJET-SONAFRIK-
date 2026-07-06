"use client";

import Link from "next/link";
import type { Track } from "@sonafrik/types";
import { Button, buttonVariants } from "@sonafrik/ui";
import {
  getPublicationActions,
  getPublicationContinueHref,
  getPublicationEditHref,
  getPublicationConsultHref,
  getPublicationResubmitHref,
  type PublicationActionId,
} from "@sonafrik/api/catalog";

export function PublicationContextualActions({
  track,
  deleting,
  onClose,
  onDelete,
  onShare,
}: {
  track: Track;
  deleting: boolean;
  onClose: () => void;
  onDelete: (track: Track) => void;
  onShare: (track: Track) => void;
}) {
  const actions = getPublicationActions(track.publication_status);

  function renderAction(id: PublicationActionId, label: string, variant: "primary" | "outline") {
    switch (id) {
      case "view":
        return (
          <Button key={id} type="button" size="sm" variant="outline" onClick={onClose}>
            {label}
          </Button>
        );
      case "edit":
      case "correct":
        return (
          <Link
            key={id}
            href={getPublicationEditHref(track.id)}
            className={buttonVariants({ variant, size: "sm" })}
          >
            {label}
          </Link>
        );
      case "continue":
        return (
          <Link
            key={id}
            href={getPublicationContinueHref(track.id)}
            className={buttonVariants({ variant, size: "sm" })}
          >
            {label}
          </Link>
        );
      case "resubmit":
        return (
          <Link
            key={id}
            href={getPublicationResubmitHref(track.id)}
            className={buttonVariants({ variant, size: "sm" })}
          >
            {label}
          </Link>
        );
      case "consult":
        return (
          <Link
            key={id}
            href={getPublicationConsultHref(track.id)}
            className={buttonVariants({ variant, size: "sm" })}
          >
            {label}
          </Link>
        );
      case "share":
        return (
          <Button key={id} type="button" size="sm" variant="outline" onClick={() => onShare(track)}>
            {label}
          </Button>
        );
      case "delete":
        return (
          <Button
            key={id}
            type="button"
            size="sm"
            variant="outline"
            disabled={deleting}
            onClick={() => onDelete(track)}
          >
            {deleting ? "Suppression…" : label}
          </Button>
        );
      default:
        return null;
    }
  }

  return (
    <div className="pub-detail__actions">
      {actions.map(({ id, label, variant }) => renderAction(id, label, variant))}
    </div>
  );
}
