"use client";

import Image from "next/image";
import { useState } from "react";
import { getArtistGradientStyle, getCoverInitials } from "@/lib/cover-placeholder";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

interface Props {
  coverPath: string | null | undefined;
  alt: string;
  artistName?: string | null;
  gradientSeed?: number;
  size?: "sm" | "md" | "lg";
  priority?: boolean;
  imgSizes?: string;
}

const SIZE_MAP = { sm: "w-10 h-10", md: "w-20 h-20", lg: "w-32 h-32" } as const;
const DEFAULT_SIZES = { sm: "40px", md: "80px", lg: "128px" } as const;

function buildSrc(path: string): string {
  return path.startsWith("http")
    ? path
    : `${SUPABASE_URL}/storage/v1/object/public/catalog-visuals/${path}`;
}

function GradientPlaceholder({
  artistName,
  gradientSeed,
}: {
  artistName: string;
  gradientSeed: number;
}) {
  const initials = getCoverInitials(artistName);

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center gap-0.5"
      style={{ background: getArtistGradientStyle(artistName, gradientSeed) }}
      aria-hidden="true"
    >
      <span
        className="font-extrabold leading-none"
        style={{
          fontSize: "clamp(12px, 28%, 28px)",
          color: "rgba(255,255,255,0.9)",
          letterSpacing: "-0.5px",
        }}
      >
        {initials}
      </span>
    </div>
  );
}

export function CoverImage({
  coverPath,
  alt,
  artistName,
  gradientSeed = 0,
  size,
  priority = false,
  imgSizes,
}: Props) {
  const [error, setError] = useState(false);
  const sizeClass = size ? SIZE_MAP[size] : "w-full h-full";
  const resolvedSizes = imgSizes ?? (size ? DEFAULT_SIZES[size] : "100vw");
  const label = artistName?.trim() || alt;

  return (
    <div className={`${sizeClass} relative overflow-hidden`}>
      {coverPath && !error ? (
        <Image
          src={buildSrc(coverPath)}
          alt={alt}
          fill
          className="object-cover"
          onError={() => setError(true)}
          sizes={resolvedSizes}
          priority={priority}
          fetchPriority={priority ? "high" : "auto"}
          loading={priority ? "eager" : "lazy"}
          quality={priority ? 80 : 55}
          placeholder="blur"
          blurDataURL="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect fill='%23222222' width='40' height='40'/%3E%3C/svg%3E"
        />
      ) : (
        <GradientPlaceholder artistName={label} gradientSeed={gradientSeed} />
      )}
    </div>
  );
}