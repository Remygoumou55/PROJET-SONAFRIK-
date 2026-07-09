"use client";

import Link from "next/link";
import { MusicNavIcon } from "./MusicNavIcon";

interface Props {
  href: string;
  label: string;
  onNavigate?: () => void;
}

export function MusicNavBackLink({ href, label, onNavigate }: Props) {
  return (
    <Link
      href={href}
      className="music-nav__back"
      aria-label={label}
      onClick={onNavigate}
    >
      <MusicNavIcon name="back" size={16} />
      <span className="music-nav__back-label">{label}</span>
    </Link>
  );
}
