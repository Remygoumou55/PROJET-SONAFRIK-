"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { SONAFRIK_BRAND } from "@sonafrik/types";
import { BRAND_ASSETS, BRAND_SIZES } from "@/lib/brand";

/** wordmark = texte seul · nav = emblème + texte · full = image officielle · hero = emblème XL + texte + tagline */
export type SonafrikLogoVariant = "wordmark" | "nav" | "full" | "hero";

export type SonafrikLogoSize = "sm" | "md" | "lg";

/** @deprecated Préférer variant="nav" | variant="wordmark" */
export type LegacySonafrikLogoSize = "nav" | "footer";

interface SonafrikLogoProps {
  variant?: SonafrikLogoVariant;
  size?: SonafrikLogoSize | LegacySonafrikLogoSize;
  showTagline?: boolean;
  href?: string;
  priority?: boolean;
  className?: string;
}

const WORDMARK_SIZE: Record<SonafrikLogoSize, string> = {
  sm: "brand-wordmark brand-wordmark--sm",
  md: "brand-wordmark brand-wordmark--md",
  lg: "brand-wordmark brand-wordmark--lg",
};

const EMBLEM_PX: Record<SonafrikLogoSize, number> = {
  sm: BRAND_SIZES.emblem.sm,
  md: BRAND_SIZES.emblem.md,
  lg: BRAND_SIZES.emblem.lg,
};

function resolveLogoProps(props: SonafrikLogoProps): {
  variant: SonafrikLogoVariant;
  size: SonafrikLogoSize;
  showTagline: boolean;
  href?: string;
  priority: boolean;
  className: string;
} {
  const { size = "md", showTagline = false, href, priority = false, className = "" } = props;
  let variant = props.variant ?? "wordmark";
  let resolvedSize: SonafrikLogoSize = "md";

  if (size === "nav") {
    variant = "nav";
    resolvedSize = "sm";
  } else if (size === "footer") {
    variant = "wordmark";
    resolvedSize = "sm";
  } else {
    resolvedSize = size;
  }

  return { variant, size: resolvedSize, showTagline, href, priority, className };
}

function SonafrikWordmark({ size = "md" }: { size?: SonafrikLogoSize }) {
  return (
    <span className={WORDMARK_SIZE[size]} aria-label={SONAFRIK_BRAND.name}>
      <span className="text-vert-energie">SON</span>
      <span className="text-or-solaire">A</span>
      <span className="text-texte-principal">FRIK</span>
    </span>
  );
}

function SonafrikTagline({ compact = false }: { compact?: boolean }) {
  return (
    <p className={compact ? "brand-tagline brand-tagline--compact" : "brand-tagline"}>
      {SONAFRIK_BRAND.slogan}
    </p>
  );
}

/** img natif — asset statique /public, zéro mismatch Next/Image SSR */
function SonafrikEmblem({
  px,
  priority = false,
  className = "",
}: {
  px: number;
  priority?: boolean;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static brand asset, hydration-safe
    <img
      src={BRAND_ASSETS.emblem}
      alt=""
      width={px}
      height={px}
      className={`brand-emblem ${className}`.trim()}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
    />
  );
}

function SonafrikLogoPrimary({
  width,
  priority = false,
}: {
  width: number;
  priority?: boolean;
}) {
  const height = Math.round(width * 1.35);
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static brand asset, hydration-safe
    <img
      src={BRAND_ASSETS.logoPrimaryVertical}
      alt={`${SONAFRIK_BRAND.name} — ${SONAFRIK_BRAND.slogan}`}
      width={width}
      height={height}
      className="brand-logo-primary"
      loading={priority ? "eager" : "lazy"}
      decoding="async"
    />
  );
}

export function SonafrikLogo(props: SonafrikLogoProps) {
  const { variant, size, showTagline, href, priority, className } = resolveLogoProps(props);

  const rootClass = ["brand-lockup", `brand-lockup--${variant}`, className]
    .filter(Boolean)
    .join(" ");

  let content: ReactNode;

  switch (variant) {
    case "full":
      content = (
        <SonafrikLogoPrimary
          width={size === "lg" ? BRAND_SIZES.logoPrimary.hero : BRAND_SIZES.logoPrimary.auth}
          priority={priority}
        />
      );
      break;
    case "hero":
      content = (
        <>
          <SonafrikEmblem px={BRAND_SIZES.emblem.hero} priority={priority} className="brand-emblem--hero" />
          <SonafrikWordmark size="lg" />
          <SonafrikTagline />
        </>
      );
      break;
    case "nav":
      content = (
        <>
          <SonafrikEmblem px={EMBLEM_PX[size]} priority={priority} />
          <span className="brand-lockup__nav-text">
            <SonafrikWordmark size={size === "lg" ? "md" : "sm"} />
            {showTagline ? <SonafrikTagline compact /> : null}
          </span>
        </>
      );
      break;
    default:
      content = (
        <>
          <SonafrikWordmark size={size} />
          {showTagline ? <SonafrikTagline compact /> : null}
        </>
      );
  }

  if (href) {
    return (
      <Link href={href} className={rootClass} aria-label={`Accueil ${SONAFRIK_BRAND.name}`}>
        {content}
      </Link>
    );
  }

  return <div className={rootClass}>{content}</div>;
}
