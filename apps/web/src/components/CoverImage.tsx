"use client";

import Image from "next/image";
import { useState } from "react";
import { CARD_GRADIENTS } from "@/lib/constants";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

interface Props {
  coverPath: string | null | undefined;
  alt: string;
  gradientSeed?: number;
  size?: "sm" | "md" | "lg";
}

const SIZE_MAP = { sm: "w-10 h-10", md: "w-20 h-20", lg: "w-32 h-32" } as const;
const IMG_SIZES = { sm: "40px", md: "80px", lg: "128px" } as const;

function buildSrc(path: string): string {
  return path.startsWith("http")
    ? path
    : `${SUPABASE_URL}/storage/v1/object/public/catalog-visuals/${path}`;
}

function GradientPlaceholder({ seed }: { seed: number }) {
  const g = CARD_GRADIENTS[seed % CARD_GRADIENTS.length]!;
  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{ background: `linear-gradient(135deg, ${g.from}28, ${g.to}14)` }}
      aria-hidden="true"
    >
      <svg width={16} height={16} viewBox="0 0 24 24" fill={g.from} aria-hidden="true">
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" fill={g.from} />
        <circle cx="18" cy="16" r="3" fill={g.from} />
      </svg>
    </div>
  );
}

export function CoverImage({ coverPath, alt, gradientSeed = 0, size }: Props) {
  const [error, setError] = useState(false);
  const sizeClass = size ? SIZE_MAP[size] : "w-full h-full";

  return (
    <div className={`${sizeClass} relative overflow-hidden`}>
      {coverPath && !error ? (
        <Image
          src={buildSrc(coverPath)}
          alt={alt}
          fill
          className="object-cover"
          onError={() => setError(true)}
          sizes={size ? IMG_SIZES[size] : "100vw"}
        />
      ) : (
        <GradientPlaceholder seed={gradientSeed} />
      )}
    </div>
  );
}
