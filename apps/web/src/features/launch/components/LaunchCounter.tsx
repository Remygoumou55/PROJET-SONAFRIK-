"use client";

import { useEffect, useRef, useState } from "react";
import type { LaunchProgress } from "@sonafrik/types";

function useCountUp(target: number, duration = 1400): number {
  const [value, setValue] = useState(0);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) frame.current = requestAnimationFrame(tick);
    }
    frame.current = requestAnimationFrame(tick);
    return () => { if (frame.current) cancelAnimationFrame(frame.current); };
  }, [target, duration]);

  return value;
}

export function LaunchCounter({ current, target, percent, launched }: LaunchProgress) {
  const animated = useCountUp(current, 1600);
  const barWidth  = Math.min((animated / target) * 100, 100);

  const color = launched ? "#00CC44" : percent >= 50 ? "#FFC20E" : "#00CC44";

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Chiffres */}
      <div className="mb-2 flex items-end justify-between">
        <div>
          <span
            className="text-6xl font-black tabular-nums leading-none"
            style={{ color }}
          >
            {animated.toLocaleString("fr-FR")}
          </span>
          <span className="ml-2 text-2xl font-bold" style={{ color: "#444444" }}>
            /{target.toLocaleString("fr-FR")}
          </span>
        </div>
        <span className="text-lg font-semibold" style={{ color }}>
          {percent.toFixed(1)} %
        </span>
      </div>

      {/* Barre de progression */}
      <div
        className="h-3 w-full overflow-hidden rounded-full"
        style={{ backgroundColor: "#1A1A1A", border: "1px solid #2A2A2A" }}
      >
        <div
          className="h-full rounded-full transition-all duration-[1600ms] ease-out"
          style={{ width: `${barWidth}%`, backgroundColor: color }}
        />
      </div>

      <p className="mt-3 text-sm text-center" style={{ color: "#555555" }}>
        {launched
          ? "Objectif atteint — SONAFRIK est lancé ! 🚀"
          : `${(target - current).toLocaleString("fr-FR")} abonnés manquants pour le lancement`}
      </p>
    </div>
  );
}
