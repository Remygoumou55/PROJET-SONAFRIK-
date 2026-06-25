"use client";

import { useCallback, useEffect, useState } from "react";
import { useAnimatedNumber } from "@/hooks/useAnimatedNumber";
import { useInView } from "@/hooks/useInView";

const POLL_MS = 60_000;

export function RoyaltiesCounter() {
  const { ref, inView } = useInView<HTMLDivElement>(0.3);
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
    void load();
    const id = setInterval(() => void load(), POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  if (!visible) return null;

  return (
    <div
      ref={ref}
      style={{
        maxWidth: "520px",
        margin: "0 auto 28px",
        backgroundColor: "rgba(0,210,106,0.06)",
        border: "1px solid rgba(0,210,106,0.15)",
        borderRadius: "12px",
        padding: "16px 20px",
        textAlign: "center",
      }}
    >
      <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.5)" }}>
        💰{" "}
        <span style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-vert-energie)" }}>
          {display.toLocaleString("fr-FR")} GNF
        </span>{" "}
        versés aux artistes ce mois
      </p>
    </div>
  );
}
