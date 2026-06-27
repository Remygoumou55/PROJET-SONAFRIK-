"use client";

import Link from "next/link";
import { memo } from "react";
import type { CreatorDashboardAssistantTip } from "@sonafrik/types";

interface ConseilBannerProps {
  tips: CreatorDashboardAssistantTip[];
}

function ConseilBannerView({ tips }: ConseilBannerProps) {
  const tip = tips[0];
  if (!tip) return null;

  return (
    <aside className="dash-conseil" aria-label="Conseil SONAFRIK">
      <span className="dash-conseil__icon" aria-hidden="true">
        {tip.icon}
      </span>
      <p className="dash-conseil__text">
        <strong>Conseil SONAFRIK :</strong> {tip.message}
      </p>
      <Link href={tip.actionHref ?? "/creator/analytics"} className="dash-conseil__link">
        Voir tous les conseils →
      </Link>
    </aside>
  );
}

export const ConseilBanner = memo(ConseilBannerView);
