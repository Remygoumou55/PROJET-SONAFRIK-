"use client";

import { useRouter } from "next/navigation";
import type { Track } from "@sonafrik/types";
import {
  getPublicationAnalyticsHref,
  getPublicationConsultHref,
  getPublicationContinueHref,
  getPublicationEditHref,
  getPublicationMenuActions,
  getPublicationResubmitHref,
  getPublicationRevenueHref,
  type PublicationActionId,
  type PublicationMenuAction,
} from "@sonafrik/api/publication-library";
import { Button, Dropdown, type DropdownItem } from "@sonafrik/ui";

async function shareTrack(track: Track, albumId?: string | null): Promise<void> {
  const text = `Écoutez « ${track.title} » sur SONAFRIK`;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const url =
    albumId && track.publication_status === "published"
      ? `${origin}/listen/album/${albumId}`
      : origin;
  if (typeof navigator !== "undefined" && navigator.share) {
    await navigator.share({ title: track.title, text, url });
    return;
  }
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(`${text} — ${url}`);
  }
}

export function PublicationRowActions({
  track,
  albumId,
  deleting,
  onDelete,
  onView,
}: {
  track: Track;
  albumId?: string | null;
  deleting: boolean;
  onDelete: (track: Track) => void;
  onView: (track: Track) => void;
}) {
  const router = useRouter();
  const menuActions = getPublicationMenuActions(track.publication_status);

  function resolveAction(id: PublicationActionId): DropdownItem | null {
    switch (id) {
      case "view":
        return { label: "Voir", onSelect: () => onView(track) };
      case "edit":
      case "correct":
        return {
          label: id === "correct" ? "Corriger" : "Modifier",
          onSelect: () => router.push(getPublicationEditHref(track.id)),
        };
      case "continue":
        return {
          label: "Continuer la publication",
          onSelect: () => router.push(getPublicationContinueHref(track.id)),
        };
      case "resubmit":
        return {
          label: "Renvoyer",
          onSelect: () => router.push(getPublicationResubmitHref(track.id)),
        };
      case "consult":
        return {
          label: "Consulter",
          onSelect: () => router.push(getPublicationConsultHref(track.id)),
        };
      case "share":
        return {
          label: "Partager",
          onSelect: () => {
            void shareTrack(track, albumId).catch(() => undefined);
          },
        };
      case "analytics":
        return {
          label: "Voir Analytics",
          onSelect: () => router.push(getPublicationAnalyticsHref()),
        };
      case "revenue":
        return {
          label: "Voir Revenus",
          onSelect: () => router.push(getPublicationRevenueHref()),
        };
      case "duplicate":
      case "withdraw":
      case "archive":
        return null;
      case "delete":
        return {
          label: deleting ? "Suppression…" : "Supprimer",
          destructive: true,
          disabled: deleting,
          onSelect: () => onDelete(track),
        };
      default:
        return null;
    }
  }

  const items: DropdownItem[] = menuActions
    .map((action: PublicationMenuAction) => {
      if (action.disabled) {
        return {
          label: action.label,
          disabled: true,
        } satisfies DropdownItem;
      }
      const resolved = resolveAction(action.id);
      if (!resolved) {
        return {
          label: action.label,
          disabled: true,
        } satisfies DropdownItem;
      }
      return {
        ...resolved,
        label: action.label,
        destructive: action.destructive ?? resolved.destructive,
      };
    })
    .filter((item: DropdownItem | null): item is DropdownItem => Boolean(item));

  return (
    <Dropdown
      label={`Actions pour ${track.title}`}
      align="end"
      trigger={
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="pub-catalog-row__menu-btn"
          aria-label={`Actions pour ${track.title}`}
          onClick={(event) => event.stopPropagation()}
        >
          ⋯
        </Button>
      }
      items={items}
    />
  );
}
