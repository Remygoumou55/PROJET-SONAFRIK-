"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { SONAFRIK_BRAND } from "@sonafrik/types";

/** wordmark = texte seul · nav = marque + texte · full = logo complet · hero = logo XL */
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

const BRAND_FULL = "/brand/sonafrik-logo-full.png";

const FULL_WIDTH: Record<SonafrikLogoSize, number> = {
  sm: 140,
  md: 180,
  lg: 240,
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
    <span className="brand-wordmark brand-wordmark--image" aria-label={SONAFRIK_BRAND.name}>
      <Image
        src={BRAND_FULL}
        alt={SONAFRIK_BRAND.name}
        width={FULL_WIDTH[size]}
        height={Math.round(FULL_WIDTH[size] * 0.22)}
        className="brand-logo-full"
        priority
      />
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

export function SonafrikLogo(props: SonafrikLogoProps) {
  const { variant, size, showTagline, href, priority, className } = resolveLogoProps(props);

  const rootClass = ["brand-lockup", `brand-lockup--${variant}`, className]
    .filter(Boolean)
    .join(" ");

  let content: ReactNode;

  switch (variant) {
    case "full":
    case "hero": {
      const imgWidth = variant === "hero" ? FULL_WIDTH.lg : FULL_WIDTH[size];
      content = (
        <>
          <Image
            src={BRAND_FULL}
            alt={SONAFRIK_BRAND.name}
            width={imgWidth}
            height={Math.round(imgWidth * 0.22)}
            className="brand-logo-full"
            priority={priority}
          />
          {showTagline !== false && (showTagline || variant === "full" || variant === "hero") ? (
            <SonafrikTagline />
          ) : null}
        </>
      );
      break;
    }
    case "nav":
      content = (
        <span className="brand-lockup__nav-text">
          <Image
            src={BRAND_FULL}
            alt={SONAFRIK_BRAND.name}
            width={FULL_WIDTH.sm}
            height={Math.round(FULL_WIDTH.sm * 0.22)}
            className="brand-logo-full brand-logo-full--nav"
            priority={priority}
          />
          {showTagline ? <SonafrikTagline compact /> : null}
        </span>
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
