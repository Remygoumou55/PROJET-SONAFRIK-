"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { CreatorAssetImage } from "./CreatorAssetImage";
import { ArtistCoverManager } from "./ArtistCoverManager";

interface ArtistCoverSliderProps {
  creatorId: string;
  stageName: string;
  coverImages: string[];
}

const SLIDE_MS = 6000;

export const ArtistCoverSlider = memo(function ArtistCoverSlider({
  creatorId,
  stageName,
  coverImages,
}: ArtistCoverSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [managerOpen, setManagerOpen] = useState(false);
  const slides = useMemo(() => coverImages.filter(Boolean), [coverImages]);

  const goNext = useCallback(() => {
    if (slides.length <= 1) return;
    setActiveIndex((i) => (i + 1) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = window.setInterval(goNext, SLIDE_MS);
    return () => window.clearInterval(timer);
  }, [goNext, slides.length]);

  const prefetchIndex = slides.length > 1 ? (activeIndex + 1) % slides.length : -1;

  return (
    <div className="artist-hero__cover-wrap">
      <div
        className="artist-hero__cover-slider"
        role="region"
        aria-label="Photos de couverture"
        aria-live="polite"
      >
        {slides.length > 0 ? (
          slides.map((path, index) => {
            const isActive = index === activeIndex;
            const shouldLoad = isActive || index === prefetchIndex;
            return (
              <div
                key={path}
                className={`artist-hero__cover-slide${isActive ? " artist-hero__cover-slide--active" : ""}`}
                aria-hidden={!isActive}
              >
                {shouldLoad ? (
                  <CreatorAssetImage
                    creatorId={creatorId}
                    path={path}
                    assetKind="gallery"
                    alt={`Couverture ${stageName}`}
                    fit="contain"
                    className="artist-hero__cover-img"
                    sizes="(max-width: 768px) 100vw, 66vw"
                    priority={index === 0}
                    fallback={<div className="artist-hero__cover-fallback" />}
                  />
                ) : null}
              </div>
            );
          })
        ) : (
          <div className="artist-hero__cover-fallback" aria-hidden="true" />
        )}

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
