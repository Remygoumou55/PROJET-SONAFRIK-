"use client";

import Link from "next/link";
import { useState } from "react";
import type { CreatorDashboardAssistantTip } from "@sonafrik/types";

interface AssistantCardProps {
  tips: CreatorDashboardAssistantTip[];
  profileUrl: string;
}

export function AssistantCard({ tips, profileUrl }: AssistantCardProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (tips.length === 0) return null;

  function handleCopy(id: string) {
    void navigator.clipboard.writeText(profileUrl).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  return (
    <section className="creator-widget creator-assistant" aria-label="Assistant SONAFRIK">
      <h2 className="creator-assistant__heading">💡 Assistant SONAFRIK</h2>
      <p className="creator-assistant__subtitle">Vos prochaines étapes pour grandir</p>
      <ul className="creator-assistant__list">
        {tips.map((tip) => (
          <li key={tip.id} className={`creator-assistant__tip creator-assistant__tip--${tip.priority}`}>
            <div className="creator-assistant__content">
              <div className="creator-assistant__header">
                <span className="creator-assistant__icon" aria-hidden="true">
                  {tip.icon}
                </span>
                <span className="creator-assistant__title">{tip.title}</span>
                <span className="creator-assistant__time">{tip.time}</span>
              </div>
              <p className="creator-assistant__message">{tip.message}</p>
            </div>
            {tip.actionType === "copy_profile" && tip.actionLabel ? (
              <button
                type="button"
                className="creator-assistant__action"
                onClick={() => handleCopy(tip.id)}
              >
                {copiedId === tip.id ? "Copié !" : tip.actionLabel}
              </button>
            ) : tip.actionHref && tip.actionLabel ? (
              <Link href={tip.actionHref} className="creator-assistant__action">
                {tip.actionLabel}
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
