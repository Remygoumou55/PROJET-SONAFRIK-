"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { SONAFRIK_BRAND } from "@sonafrik/types";

/** wordmark = texte seul · nav = texte compact · full = texte + tagline · hero = texte XL + tagline */
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

function resolveLogoProps(props: SonafrikLogoProps): {
  variant: SonafrikLogoVariant;
  size: SonafrikLogoSize;
  showTagline: boolean;
  href?: string;
  className: string;
} {
  const { size = "md", showTagline = false, href, className = "" } = props;
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

  return { variant, size: resolvedSize, showTagline, href, className };
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

export function SonafrikLogo(props: SonafrikLogoProps) {
  const { variant, size, showTagline, href, className } = resolveLogoProps(props);

  const rootClass = ["brand-lockup", `brand-lockup--${variant}`, className]
    .filter(Boolean)
    .join(" ");

  let content: ReactNode;

  switch (variant) {
    case "full":
    case "hero":
      content = (
        <>
          <SonafrikWordmark size={variant === "hero" ? "lg" : "md"} />
          <SonafrikTagline />
        </>
      );
      break;
    case "nav":
      content = (
        <span className="brand-lockup__nav-text">
          <SonafrikWordmark size={size === "lg" ? "md" : "sm"} />
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
