"use client";

import Image from "next/image";
import { memo } from "react";
import type { CreatorAssetKind } from "@sonafrik/types";
import { useCreatorAssetUrl } from "../hooks/useCreatorAssetUrl";

interface CreatorAssetImageProps {
  creatorId: string;
  path: string | null | undefined;
  assetKind: CreatorAssetKind;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
  fallback?: React.ReactNode;
}

export const CreatorAssetImage = memo(function CreatorAssetImage({
  creatorId,
  path,
  assetKind,
  alt,
  className = "",
  priority = false,
  sizes = "100vw",
  fallback = null,
}: CreatorAssetImageProps) {
  const { url, error } = useCreatorAssetUrl(creatorId, path, assetKind);

  if (!path || error || !url) {
    return <>{fallback}</>;
  }

  return (
    <Image
      src={url}
      alt={alt}
      fill
      className={`object-cover ${className}`}
      sizes={sizes}
      priority={priority}
      loading={priority ? "eager" : "lazy"}
      quality={priority ? 75 : 55}
      onError={() => undefined}
    />
  );
});
