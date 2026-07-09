"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createListenerService } from "@sonafrik/api/listener";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { RecommendedTrack } from "@sonafrik/types";
import { CoverImage } from "@/components/CoverImage";

const REASON_LABELS: Record<RecommendedTrack["reason"], string> = {
  genre_affinity: "Votre genre",
  new_release:    "Nouveauté",
  trending:       "Tendance",
  collaborative:  "Populaire",
};

function TrackRecommendedCard({ track, index }: { track: RecommendedTrack; index: number }) {
  const href = `/listen/track/${track.track_id}`;
  const reasonLabel = REASON_LABELS[track.reason] ?? "Tendance";

  return (
    <Link
      href={href}
      className="reco-card flex-shrink-0 flex flex-col gap-2 w-[7.5rem] group"
      aria-label={`${track.title} par ${track.artist_name ?? "Artiste"}`}
    >
      <div className="reco-card__cover w-[7.5rem] h-[7.5rem] rounded-xl overflow-hidden relative">
        <CoverImage
          coverPath={track.cover_path}
          alt=""
          artistName={track.artist_name ?? track.title}
          gradientSeed={index + 200}
          imgSizes="120px"
        />
        <div className="reco-card__play-overlay absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity">
          <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "var(--color-vert-energie)" }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="var(--color-noir-profond)">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="reco-card__reason text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--color-vert-energie)" }}>
          {reasonLabel}
        </span>
        <p className="text-[12px] font-bold leading-tight truncate" style={{ color: "var(--color-texte-principal)" }}>
          {track.title}
        </p>
        <p className="text-[10px] leading-tight truncate" style={{ color: "var(--color-texte-subtil)" }}>
          {track.artist_name}
        </p>
      </div>
    </Link>
  );
}

export function RecommendedSection() {
  const [tracks, setTracks] = useState<RecommendedTrack[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const service = createListenerService(getSupabaseBrowserClient());
    service
      .getRecommendedTracks(20)
      .then(setTracks)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mt-8 px-6">
        <div className="h-5 w-48 rounded animate-pulse mb-4" style={{ backgroundColor: "var(--color-card)" }} />
        <div className="flex gap-4 overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-[7.5rem] flex-shrink-0 space-y-2">
              <div className="w-[7.5rem] h-[7.5rem] rounded-xl animate-pulse" style={{ backgroundColor: "var(--color-card)", animationDelay: `${i * 60}ms` }} />
              <div className="h-3 w-4/5 rounded animate-pulse" style={{ backgroundColor: "var(--color-card)" }} />
              <div className="h-2.5 w-3/5 rounded animate-pulse" style={{ backgroundColor: "var(--color-card)" }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (tracks.length === 0) return null;

  return (
    <section className="mt-8" aria-label="Recommandé pour vous">
      <div className="flex items-center justify-between px-6 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "var(--color-vert-energie-bg)", border: "1px solid var(--color-vert-energie-ring)" }}>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="var(--color-vert-energie)" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <h2 className="text-base font-extrabold" style={{ color: "var(--color-texte-principal)" }}>
            ❤️ Recommandé pour vous
          </h2>
        </div>
        <Link
          href="/search"
          className="text-[10px] font-bold px-2.5 py-1 rounded-full"
          style={{ background: "var(--color-surface)", color: "var(--color-vert-energie)", border: "1px solid var(--color-elevated)" }}
        >
          Voir tout →
        </Link>
      </div>
      <div className="scrollbar-hide flex gap-4 overflow-x-auto pb-2 px-6">
        {tracks.map((track, i) => (
          <TrackRecommendedCard key={track.track_id} track={track} index={i} />
        ))}
      </div>
    </section>
  );
}
