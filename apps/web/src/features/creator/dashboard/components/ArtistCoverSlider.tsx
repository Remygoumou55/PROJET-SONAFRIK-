"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { CreatorAssetImage } from "./CreatorAssetImage";
import { ArtistCoverManager } from "./ArtistCoverManager";

interface ArtistCoverSliderProps {
  creatorId: string;
  stageName: string;
  coverImages: string[];
  variant?: "default" | "compact";
}

const SLIDE_MS = 6000;

export const ArtistCoverSlider = memo(function ArtistCoverSlider({
  creatorId,
  stageName,
  coverImages,
  variant = "default",
}: ArtistCoverSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [managerOpen, setManagerOpen] = useState(false);
  const slides = useMemo(() => coverImages.filter(Boolean), [coverImages]);
  const isCompact = variant === "compact";

  const goNext = useCallback(() => {
    if (slides.length <= 1) return;
    setActiveIndex((i) => (i + 1) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = window.setInterval(goNext, SLIDE_MS);
    return () => window.clearInterval(timer);
  }, [goNext, slides.length]);

  const sliderClass = isCompact
    ? "artist-hero__cover-slider artist-hero__cover-slider--compact"
    : "artist-hero__cover-slider";

  const activePath = slides[activeIndex] ?? null;

  return (
    <div className="artist-hero__cover-wrap">
      <div
        className={sliderClass}
        role="region"
        aria-label="Photos de couverture"
        aria-live="polite"
      >
        {activePath ? (
          <div className="artist-hero__cover-slide artist-hero__cover-slide--active">
            <CreatorAssetImage
              creatorId={creatorId}
              path={activePath}
              assetKind="gallery"
              alt={`Couverture ${stageName}`}
              fit="cover"
              layout="bounded"
              className="artist-hero__cover-img"
              priority
              fallback={<div className="artist-hero__cover-fallback" />}
            />
          </div>
        ) : (
          <div className="artist-hero__cover-fallback" aria-hidden="true" />
        )}

        <div className="artist-hero__cover-scrim" aria-hidden="true" />

        {slides.length > 1 ? (
          <div className="artist-hero__cover-dots" role="tablist" aria-label="Navigation couverture">
            {slides.map((path, index) => (
              <button
                key={path}
                type="button"
                role="tab"
                aria-selected={index === activeIndex}
                aria-label={`Couverture ${index + 1}`}
                className={`artist-hero__cover-dot${index === activeIndex ? " artist-hero__cover-dot--active" : ""}`}
                onClick={() => setActiveIndex(index)}
              />
            ))}
          </div>
        ) : null}
      </div>

      <button
        type="button"
        className="artist-hero__cover-edit"
        aria-label="Gérer les photos de couverture"
        onClick={() => setManagerOpen(true)}
      >
        Gérer la couverture
      </button>

      <ArtistCoverManager
        creatorId={creatorId}
        stageName={stageName}
        coverImages={slides}
        open={managerOpen}
        onOpenChange={setManagerOpen}
        onImagesChange={() => setActiveIndex(0)}
      />
    </div>
  );
});
