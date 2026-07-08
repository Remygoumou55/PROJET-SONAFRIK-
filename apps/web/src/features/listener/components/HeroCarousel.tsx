"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createListenerService } from "@sonafrik/api/listener";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { HeroItem } from "@sonafrik/types";
import { HeroArtistCard } from "./hero/HeroArtistCard";
import { HeroAlbumCard } from "./hero/HeroAlbumCard";
import { getHeroTheme } from "./hero/heroEditorial";

const ROTATION_MS = 7000;
const PEEK_PX = 44;
const GAP_PX = 12;

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

function HeroItemCard({
  item,
  slideIndex,
  isActive,
}: {
  item: HeroItem;
  slideIndex: number;
  isActive: boolean;
}) {
  const theme = getHeroTheme(item, slideIndex);
  if (item.content_type === "artist") {
    return <HeroArtistCard item={item} theme={theme} index={slideIndex} isActive={isActive} />;
  }
  if (item.content_type === "album") {
    return <HeroAlbumCard item={item} theme={theme} index={slideIndex} isActive={isActive} />;
  }
  return null;
}

export function HeroCarousel() {
  const [items, setItems] = useState<HeroItem[]>([]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [containerPx, setContainerPx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartX = useRef<number | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const service = createListenerService(getSupabaseBrowserClient());
    service.getHeroDiscoveryFeed(20).then(setItems).catch(() => {});
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setContainerPx(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const goTo = useCallback(
    (i: number) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setIndex((prev) => {
        const n = items.length;
        return n > 0 ? ((i % n) + n) % n : prev;
      });
    },
    [items.length],
  );

  const next = useCallback(() => {
    setIndex((prev) => {
      const n = items.length;
      return n > 0 ? (prev + 1) % n : 0;
    });
  }, [items.length]);

  const prev = useCallback(() => {
    setIndex((prev) => {
      const n = items.length;
      return n > 0 ? (prev - 1 + n) % n : 0;
    });
  }, [items.length]);

  useEffect(() => {
    if (items.length <= 1 || paused || reducedMotion) return;
    timerRef.current = setTimeout(next, ROTATION_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [index, items.length, paused, reducedMotion, next]);

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
    if (Math.abs(dx) > 44) {
      if (dx < 0) next();
      else prev();
    }
    touchStartX.current = null;
  };

  if (items.length === 0) return null;

  const current = items[index]!;
  const slidePx = containerPx > 0 ? containerPx - PEEK_PX : 0;
  const translatePx = slidePx > 0 ? index * (slidePx + GAP_PX) : 0;

  return (
    <div
      ref={containerRef}
      className="hcarousel"
      role="region"
      aria-roledescription="carousel"
      aria-label="Découverte musicale"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      tabIndex={0}
    >
      {/* Live region for screen readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {current.content_type === "artist"
          ? `Artiste ${index + 1} sur ${items.length} : ${current.stage_name}`
          : `Album ${index + 1} sur ${items.length} : ${current.album_title} par ${current.stage_name}`}
      </div>

      {/* Slide track */}
      <div
        className="hcarousel__track"
        style={{ transform: translatePx > 0 ? `translateX(-${translatePx}px)` : undefined }}
      >
        {items.map((item, i) => {
          const key =
            item.content_type === "artist" ? `artist-${item.creator_id}` : `album-${item.album_id}`;
          return (
            <div
              key={key}
              className="hcarousel__slide"
              style={{ width: slidePx > 0 ? `${slidePx}px` : "100%" }}
              aria-hidden={i !== index ? true : undefined}
            >
              <HeroItemCard item={item} slideIndex={i} isActive={i === index} />
            </div>
          );
        })}
      </div>

      {/* Pagination dots */}
      {items.length > 1 && (
        <div className="hcarousel__dots" role="tablist" aria-label="Diapositives">
          {items.map((item, i) => {
            const key =
              item.content_type === "artist" ? `dot-artist-${item.creator_id}` : `dot-album-${item.album_id}`;
            const label =
              item.content_type === "artist" ? item.stage_name : item.album_title;
            return (
              <button
                key={key}
                role="tab"
                aria-selected={i === index}
                aria-label={label}
                className={`hcarousel__dot${i === index ? " hcarousel__dot--active" : ""}`}
                onClick={() => goTo(i)}
                type="button"
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
