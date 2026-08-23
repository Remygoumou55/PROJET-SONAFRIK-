"use client";

import { useCallback, useEffect, useState } from "react";
import { useAnimatedNumber } from "@/hooks/useAnimatedNumber";
import { useInView } from "@/hooks/useInView";
import { usePageVisible } from "@/hooks/usePageVisible";

const POLL_MS = 60_000;

export function RoyaltiesCounter() {
  const { ref, inView } = useInView<HTMLDivElement>(0.3);
  const pageVisible = usePageVisible();
  const [monthly, setMonthly] = useState(0);
  const [visible, setVisible] = useState(false);
  const display = useAnimatedNumber(monthly, inView && visible);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/landing/stats", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as {
        visible?: boolean;
        monthlyRoyaltiesGnf?: number;
      };
      if (!data.visible || !data.monthlyRoyaltiesGnf) {
        setVisible(false);
        return;
      }
      setMonthly(data.monthlyRoyaltiesGnf);
      setVisible(true);
    } catch {
      setVisible(false);
    }
  }, []);

  useEffect(() => {
    if (!inView || !pageVisible) return;
    void load();
    const id = setInterval(() => void load(), POLL_MS);
    return () => clearInterval(id);
  }, [load, inView, pageVisible]);

  if (!visible) return null;

  return (
    <div
      ref={ref}
      className="mx-auto mb-7 max-w-[520px] rounded-xl border border-[var(--t8-primary-lavender)]/20 bg-[var(--t8-primary-lavender)]/5 px-5 py-4 text-center"
    >
      <p className="m-0 text-[13px] text-white/50">
        💰{" "}
        <span className="text-2xl font-bold text-[var(--t8-primary-lavender)]">
          {display.toLocaleString("fr-FR")} GNF
        </span>{" "}
        versés aux artistes ce mois
      </p>
    </div>
  );
}
