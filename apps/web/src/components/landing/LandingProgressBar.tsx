"use client";

import { useEffect, useState } from "react";

interface LandingProgressBarProps {
  pct: number;
}

export function LandingProgressBar({ pct }: LandingProgressBarProps) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setWidth(pct), 100);
    return () => clearTimeout(timer);
  }, [pct]);

  return (
    <div className="my-3 h-1.5 overflow-hidden rounded-sm bg-white/10">
      <div
        className="h-1.5 rounded-sm bg-gradient-to-r from-vert-energie to-vert-profond transition-[width] duration-[1500ms] ease-out"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
