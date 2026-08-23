
import type { ReactNode } from "react";
import type { MusicNavRole } from "./musicNavTypes";
import { MusicSidebarBrand } from "./MusicSidebarBrand";
import { MusicSidebarStory } from "./MusicSidebarStory";

interface MusicSidebarProps {
  role: MusicNavRole;
  ariaLabel: string;
  storyPulse?: string;
  brandSubtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  id?: string;
  className?: string;
}

export function MusicSidebar({
  role,
  ariaLabel,
  storyPulse,
  brandSubtitle,
  children,
  footer,
  id,
  className = "",
}: MusicSidebarProps) {
  return (
    <aside
      id={id}
      className={`music-sidebar${className ? ` ${className}` : ""}`}
      role="navigation"
      aria-label={ariaLabel}
    >
      <div className="music-sidebar__pattern" aria-hidden="true" />
      <div className="music-sidebar__body">
        <MusicSidebarBrand role={role} subtitle={brandSubtitle} />
        <MusicSidebarStory role={role} pulse={storyPulse} />
        {children}
        {footer ? <div className="music-sidebar__footer">{footer}</div> : null}
      </div>
    </aside>
  );
}
