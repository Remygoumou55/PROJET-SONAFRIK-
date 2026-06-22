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
    <div
      style={{
        height: "6px",
        backgroundColor: "rgba(255,255,255,0.08)",
        borderRadius: "3px",
        overflow: "hidden",
        margin: "12px 0",
      }}
    >
      <div
        style={{
          height: "6px",
          background: "linear-gradient(90deg, var(--color-vert-energie), var(--color-vert-profond))",
          borderRadius: "3px",
          width: `${width}%`,
          transition: "width 1.5s ease",
        }}
      />
    </div>
  );
}
