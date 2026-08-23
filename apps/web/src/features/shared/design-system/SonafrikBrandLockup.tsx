
import { SONAFRIK_BRAND } from "@sonafrik/types";
import { SonafrikLogo } from "@/components/shared/SonafrikLogo";

/** LibellÃ©s contexte rÃ´le (header, wallet, etc.) â€” pas le lockup sidebar. */
export const BRAND_CONTEXT_LABELS = {
  listener: "ESPACE AUDITEUR",
  artist: "ESPACE ARTISTE",
  admin: "BACK-OFFICE",
  governance: "SUPER ADMIN",
} as const;

export type BrandContextKey = keyof typeof BRAND_CONTEXT_LABELS;

interface SonafrikBrandLockupProps {
  /** Sous-titre â€” dÃ©faut slogan officiel */
  contextLabel?: string;
  priority?: boolean;
  className?: string;
}

/**
 * Lockup officiel SONAFRIK â€” logo + slogan sous le logo.
 */
export function SonafrikBrandLockup({
  contextLabel = SONAFRIK_BRAND.slogan,
  priority = true,
  className = "",
}: SonafrikBrandLockupProps) {
  return (
    <div className={`ds-brand-lockup${className ? ` ${className}` : ""}`}>
      <SonafrikLogo
        variant="full"
        size="sm"
        showTagline={false}
        priority={priority}
        className="ds-brand-lockup__logo"
      />
      <span className="ds-brand-lockup__context">{contextLabel}</span>
    </div>
  );
}

export function resolveBrandContextLabel(
  role: BrandContextKey,
  override?: string,
): string {
  return override ?? BRAND_CONTEXT_LABELS[role];
}

