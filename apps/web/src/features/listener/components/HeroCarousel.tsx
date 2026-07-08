"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CoverImage } from "@/components/CoverImage";
import { createListenerService } from "@sonafrik/api/listener";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { TrendingArtist } from "@sonafrik/types";

const ROTATION_MS = 6000;
const PEEK_PX = 40;
const GAP_PX = 10;

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

export function HeroCarousel() {
  const [artists, setArtists] = useState<TrendingArtist[]>([]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [containerPx, setContainerPx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartX = useRef<number | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  // Fetch trending artists once on mount
  useEffect(() => {
    const service = createListenerService(getSupabaseBrowserClient());
    service.getTrendingArtistsMixed(15).then(setArtists).catch(() => {});
  }, []);

  // Measure container width for pixel-accurate peek
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setContainerPx(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const goTo = useCallback((i: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIndex((prev) => {
      const n = artists.length;
      if (n === 0) return prev;
      return ((i % n) + n) % n;
    });
  }, [artists.length]);

  const next = useCallback(() => {
    setIndex((prev) => {
      const n = artists.length;
      return n > 0 ? (prev + 1) % n : 0;
    });
  }, [artists.length]);

  const prev = useCallback(() => {
    setIndex((prev) => {
      const n = artists.length;
      return n > 0 ? (prev - 1 + n) % n : 0;
    });
  }, [artists.length]);

  // Auto-rotate: restarts on index change so timer always starts fresh
  useEffect(() => {
    if (artists.length <= 1 || paused || reducedMotion) return;
    timerRef.current = setTimeout(next, ROTATION_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [index, artists.length, paused, reducedMotion, next]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    },
    [next, prev],
  );

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
    if (Math.abs(dx) > 40) {
      if (dx < 0) next();
      else prev();
    }
    touchStartX.current = null;
  };

  if (artists.length === 0) return null;

  const current = artists[index]!;
  // Slide width: container minus peek allowance
  const slidePx = containerPx > 0 ? containerPx - PEEK_PX : 0;
  const translatePx = slidePx > 0 ? index * (slidePx + GAP_PX) : 0;

  return (
    <div
      ref={containerRef}
      className="hcarousel"
      role="region"
      aria-roledescription="carousel"
      aria-label="Artistes tendance"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      tabIndex={0}
    >
      {/* Live region announces slide changes to screen readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {`Artiste ${index + 1} sur ${artists.length} : ${current.stage_name}`}
      </div>

      <div
        className="hcarousel__track"
        style={{ transform: translatePx > 0 ? `translateX(-${translatePx}px)` : undefined }}
      >
        {artists.map((artist, i) => (
          <Link
            key={artist.creator_id}
            href={`/listen/artist/${artist.creator_id}`}
            className="hcarousel__slide"
            style={{ width: slidePx > 0 ? `${slidePx}px` : "100%" }}
            aria-hidden={i !== index ? true : undefined}
            tabIndex={i !== index ? -1 : 0}
            aria-label={`Voir le profil de ${artist.stage_name}`}
          >
            <div className="hcarousel__bg" aria-hidden="true">
              <CoverImage
                coverPath={artist.cover_path}
                alt=""
                artistName={artist.stage_name}
                gradientSeed={i}
                imgSizes="(max-width: 768px) 95vw, 70vw"
                priority={i === 0}
              />
            </div>

            <div className="hcarousel__overlay" aria-hidden="true" />

            <div className="hcarousel__content">
              {artist.verified && (
                <span className="hcarousel__badge">VÉRIFIÉ</span>
              )}
              <h2 className="hcarousel__title">{artist.stage_name}</h2>
              {artist.listen_count > 0 && (
                <p className="hcarousel__subtitle">
                  {artist.listen_count.toLocaleString("fr-FR")} écoutes
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {artists.length > 1 && (
        <div className="hcarousel__dots" role="tablist" aria-label="Diapositives">
          {artists.map((artist, i) => (
            <button
              key={artist.creator_id}
              role="tab"
              aria-selected={i === index}
              aria-label={artist.stage_name}
              className={`hcarousel__dot${i === index ? " hcarousel__dot--active" : ""}`}
              onClick={() => goTo(i)}
              type="button"
            />
          ))}
        </div>
      )}
    </div>
  );
}
