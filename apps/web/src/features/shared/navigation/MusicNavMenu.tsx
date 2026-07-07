import type { ReactNode } from "react";

interface Props {
  title: string;
  children: ReactNode;
  className?: string;
}

export function MusicNavSection({ title, children, className = "" }: Props) {
  if (!title.trim()) {
    return <div className={`music-nav__group${className ? ` ${className}` : ""}`}>{children}</div>;
  }
  return (
    <div className={`music-nav__section${className ? ` ${className}` : ""}`}>
      <p className="music-nav__section-title">{title}</p>
      <div className="music-nav__group">{children}</div>
    </div>
  );
}

export function MusicNavSeparator() {
  return <div className="music-nav__separator" role="separator" aria-hidden="true" />;
}

interface MenuProps {
  ariaLabel: string;
  children: ReactNode;
  className?: string;
}

export function MusicNavMenu({ ariaLabel, children, className = "" }: MenuProps) {
  return (
    <nav className={`music-nav${className ? ` ${className}` : ""}`} aria-label={ariaLabel}>
      {children}
    </nav>
  );
}
