"use client";

import { memo } from "react";
import type { CreatorCareerOsState } from "@sonafrik/types";

interface CareerNotificationProps {
  message: string;
  tone: CreatorCareerOsState["encouragementTone"];
}

function CareerNotificationView({ message, tone }: CareerNotificationProps) {
  return (
    <p
      className={`career-os__notification career-os__notification--${tone}`}
      role="status"
      aria-live="polite"
    >
      {message}
    </p>
  );
}

export const CareerNotification = memo(CareerNotificationView);
