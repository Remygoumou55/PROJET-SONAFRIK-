import type { MusicNavBadgeKind } from "./musicNavTypes";

interface Props {
  kind?: MusicNavBadgeKind;
  label: string | number;
  className?: string;
}

export function MusicNavBadge({ kind = "default", label, className = "" }: Props) {
  return (
    <span
      className={`music-nav__badge music-nav__badge--${kind}${className ? ` ${className}` : ""}`}
      aria-hidden={kind === "live" ? undefined : true}
    >
      {kind === "live" ? "LIVE" : label}
    </span>
  );
}
