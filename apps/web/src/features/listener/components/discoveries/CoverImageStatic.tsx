import Image from "next/image";
import { getArtistGradientStyle, getCoverInitials } from "@/lib/cover-placeholder";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

function isOptimizableUrl(src: string): boolean {
  return SUPABASE_URL !== "" && src.startsWith(SUPABASE_URL);
}

interface CoverImageStaticProps {
  coverPath: string | null | undefined;
  alt: string;
  artistName?: string | null;
  gradientSeed?: number;
  priority?: boolean;
  imgSizes?: string;
}

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
          color: "rgba(247, 243, 255,0.9)",
          letterSpacing: "-0.5px",
        }}
      >
        {initials}
      </span>
    </div>
  );
}

/** Pochette catalogue — rendu serveur (îlot statique DiscoveriesSection). */
export function CoverImageStatic({
  coverPath,
  alt,
  artistName,
  gradientSeed = 0,
  priority = false,
  imgSizes = "160px",
}: CoverImageStaticProps) {
  const label = artistName?.trim() || alt;

  return (
    <div className="w-full h-full relative overflow-hidden">
      {coverPath ? (
        <Image
          src={buildSrc(coverPath)}
          alt={alt}
          fill
          className="object-cover"
          unoptimized={!isOptimizableUrl(buildSrc(coverPath))}
          sizes={imgSizes}
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
