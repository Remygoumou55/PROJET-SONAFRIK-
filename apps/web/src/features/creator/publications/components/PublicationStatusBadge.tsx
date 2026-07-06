import type { PublicationStatus } from "@sonafrik/types";
import { PUBLICATION_STATUS_LABELS } from "@sonafrik/types/catalog";

const STATUS_VARIANT: Record<PublicationStatus, string> = {
  draft: "pub-status--draft",
  pending_review: "pub-status--review",
  published: "pub-status--published",
  rejected: "pub-status--rejected",
  archived: "pub-status--archived",
};

export function PublicationStatusBadge({ status }: { status: PublicationStatus }) {
  return (
    <span className={`pub-status ${STATUS_VARIANT[status]}`}>
      {PUBLICATION_STATUS_LABELS[status]}
    </span>
  );
}
