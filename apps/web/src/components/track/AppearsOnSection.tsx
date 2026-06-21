import Link from "next/link";
import type { TrackAppearance } from "@sonafrik/types";
import { TRACK_CREDIT_ROLE_LABELS } from "@sonafrik/types";
import { CoverImage } from "@/components/CoverImage";

interface AppearsOnSectionProps {
  appearances: TrackAppearance[];
}

export function AppearsOnSection({ appearances }: AppearsOnSectionProps) {
  if (!appearances.length) return null;

  return (
    <section className="mb-8">
      <h2
        className="text-sm font-semibold mb-3 uppercase tracking-wider"
        style={{ color: "var(--color-texte-desactive)" }}
      >
        Apparaît sur
      </h2>

      <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
        {appearances.map((item) => (
          <Link
            key={`${item.trackId}-${item.creditRole}`}
            href={item.albumId ? `/listen/album/${item.albumId}` : "#"}
            className="flex-shrink-0 w-24 group"
          >
            {/* Cover */}
            <div
              className="w-24 h-24 rounded-xl overflow-hidden mb-2 relative"
              style={{ backgroundColor: "var(--color-card)" }}
            >
              <CoverImage
                coverPath={item.coverUrl}
                alt={item.trackTitle}
                gradientSeed={
                  item.trackId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
                }
                imgSizes="96px"
              />
              {/* Badge rôle */}
              <span
                className="absolute bottom-1.5 right-1.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: "rgba(0,210,106,0.15)",
                  color: "var(--color-vert-energie)",
                  backdropFilter: "blur(4px)",
                }}
              >
                {TRACK_CREDIT_ROLE_LABELS[item.creditRole]}
              </span>
            </div>

            {/* Titre */}
            <p
              className="text-xs font-medium truncate group-hover:underline"
              style={{ color: "var(--color-texte-principal)" }}
            >
              {item.trackTitle}
            </p>

            {/* Artiste principal */}
            <p className="text-[10px] mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.4)" }}>
              {item.mainArtistName}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
