"use client";

import Image from "next/image";
import { memo, useEffect, useState } from "react";
import type { CreatorAssetKind } from "@sonafrik/types";
import { useCreatorAssetUrl } from "../hooks/useCreatorAssetUrl";

interface CreatorAssetImageProps {
  creatorId: string;
  path: string | null | undefined;
  assetKind: CreatorAssetKind;
  alt: string;
  className?: string;
  fit?: "cover" | "contain";
  priority?: boolean;
  sizes?: string;
  fallback?: React.ReactNode;
  /** fill = Next/Image fill. bounded = native img clipped in frame (Hero-safe, no bleed). */
  layout?: "fill" | "bounded";
}

export const CreatorAssetImage = memo(function CreatorAssetImage({
  creatorId,
  path,
  assetKind,
  alt,
  className = "",
  fit = "cover",
  priority = false,
  sizes = "480px",
  fallback = null,
  layout = "bounded",
}: CreatorAssetImageProps) {
  const { url, error } = useCreatorAssetUrl(creatorId, path, assetKind);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const showImage = hydrated && Boolean(path && url && !error);

  if (!showImage) {
    return <>{fallback}</>;
  }

  const objectClass = fit === "contain" ? "object-contain" : "object-cover";

  if (layout === "bounded") {
    return (
      <span className="creator-asset-image__bounded">
        {/* eslint-disable-next-line @next/next/no-img-element -- bounded frame prevents dashboard background bleed */}
        <img
          src={url!}
          alt={alt}
          className={`creator-asset-image__img ${objectClass} ${className}`.trim()}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
        />
      </span>
    );
  }

  return (
    <Image
      src={url!}
      alt={alt}
      fill
      className={`${objectClass} ${className}`.trim()}
      sizes={sizes}
      priority={priority}
      loading={priority ? "eager" : "lazy"}
      quality={priority ? 75 : 55}
      onError={() => undefined}
    />
  );
});
