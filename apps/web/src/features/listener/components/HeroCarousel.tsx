"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface HeroSlide {
  id: string;
  title: string;
  subtitle: string | null;
  cover_url: string | null;
  track_id: string | null;
  display_order: number;
}

const SESSION_KEY = "hero_carousel_closed";
const ROTATION_MS = 6000;

function usePrefersReducedMotion() {
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
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [active, setActive] = useState(0);
  const [closed, setClosed] = useState(false);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartX = useRef<number | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === "1") {
      setClosed(true);
      return;
    }

    // hero_slides not yet in generated DB types — cast after migration
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = getSupabaseBrowserClient() as any;
    void (db
      .from("hero_slides")
      .select("id,title,subtitle,cover_url,track_id,display_order")
      .eq("is_active", true)
      .or("starts_at.is.null,starts_at.lte." + new Date().toISOString())
      .or("ends_at.is.null,ends_at.gte." + new Date().toISOString())
      .order("display_order", { ascending: true })
      .limit(10)
      .then((res: { data: HeroSlide[] | null }) => {
        if (res.data && res.data.length > 0) setSlides(res.data);
        setLoading(false);
      }) as Promise<void>);
  }, []);

  const goTo = useCallback(
    (idx: number) => {
      if (slides.length === 0) return;
      setActive(((idx % slides.length) + slides.length) % slides.length);
    },
    [slides.length],
  );

  const next = useCallback(() => goTo(active + 1), [active, goTo]);
  const prev = useCallback(() => goTo(active - 1), [active, goTo]);

  useEffect(() => {
    if (slides.length <= 1 || paused || reducedMotion) return;
    timerRef.current = setTimeout(next, ROTATION_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [active, slides.length, paused, reducedMotion, next]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
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

  const handleClose = () => {
    sessionStorage.setItem(SESSION_KEY, "1");
    setClosed(true);
  };

  if (loading || closed || slides.length === 0) return null;

  const slide = slides[active]!;

  return (
    <div
      className="hcarousel"
      role="region"
      aria-roledescription="carousel"
      aria-label="Bannières SONAFRIK"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      tabIndex={0}
    >
      <div
        className="hcarousel__track"
        aria-live="polite"
        aria-atomic="true"
        aria-label={`Diapositive ${active + 1} sur ${slides.length} : ${slide.title}`}
      >
        {slide.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={slide.cover_url}
            alt=""
            className="hcarousel__bg"
            aria-hidden="true"
          />
        ) : (
          <div className="hcarousel__bg hcarousel__bg--gradient" aria-hidden="true" />
        )}
        <div className="hcarousel__overlay" aria-hidden="true" />

        <div className="hcarousel__content">
          <span className="hcarousel__badge" aria-hidden="true">SONAFRIK</span>
          <h2 className="hcarousel__title">{slide.title}</h2>
          {slide.subtitle && (
            <p className="hcarousel__subtitle">{slide.subtitle}</p>
          )}
        </div>
      </div>

      {slides.length > 1 && (
        <div className="hcarousel__dots" role="tablist" aria-label="Diapositives">
          {slides.map((s, i) => (
            <button
              key={s.id}
              role="tab"
              aria-selected={i === active}
              aria-label={`Diapositive ${i + 1}`}
              className={`hcarousel__dot${i === active ? " hcarousel__dot--active" : ""}`}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      )}

      <button
        className="hcarousel__close"
        onClick={handleClose}
        aria-label="Fermer le carousel"
        type="button"
      >
        ✕
      </button>
    </div>
  );
}
