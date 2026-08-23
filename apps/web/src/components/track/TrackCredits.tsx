import Link from "next/link";
import type { TrackCredit } from "@sonafrik/types";
import { TRACK_CREDIT_ROLE_LABELS, TRACK_CREDIT_ROLE_ORDER } from "@sonafrik/types";

interface TrackCreditsProps {
  credits: TrackCredit[];
}

export function TrackCredits({ credits }: TrackCreditsProps) {
  if (!credits.length) return null;

  const byRole = new Map<string, TrackCredit[]>();
  for (const credit of credits) {
    const existing = byRole.get(credit.role) ?? [];
    existing.push(credit);
    byRole.set(credit.role, existing);
  }

  const rolesToShow = TRACK_CREDIT_ROLE_ORDER.filter(
    (role) => role !== "artiste_principal" && byRole.has(role),
  );

  if (!rolesToShow.length) return null;

  return (
    <div className="mt-3 space-y-2">
      <p
        className="text-xs font-semibold uppercase"
        style={{ color: "rgba(247, 243, 255,0.4)", letterSpacing: "0.5px" }}
      >
        Crédits
      </p>
      <div className="space-y-1.5">
        {rolesToShow.map((role) => {
          const group = byRole.get(role)!;
          return (
            <div key={role}>
              <p className="text-xs" style={{ color: "rgba(247, 243, 255,0.35)" }}>
                {TRACK_CREDIT_ROLE_LABELS[role]}
              </p>
              <p className="text-sm font-medium" style={{ color: "var(--color-texte-principal)" }}>
                {group.map((c, i) => (
                  <span key={c.id}>
                    {i > 0 && ", "}
                    {c.contributor_creator_id ? (
                      <Link
                        href={`/listen/artist/${c.contributor_creator_id}`}
                        className="hover:text-[var(--t8-primary-lavender)] transition-colors"
                        style={{ color: "inherit" }}
                      >
                        {c.contributor_name}
                      </Link>
                    ) : (
                      c.contributor_name
                    )}
                  </span>
                ))}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
