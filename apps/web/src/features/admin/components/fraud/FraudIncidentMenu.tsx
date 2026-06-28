"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";

export interface FraudMenuAction {
  id: string;
  label: string;
  tone?: "danger" | "default";
  onSelect: () => void;
}

interface Props {
  actions: FraudMenuAction[];
  ariaLabel?: string;
}

function FraudIncidentMenuView({ actions, ariaLabel = "Actions incident" }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const run = useCallback((action: FraudMenuAction) => {
    setOpen(false);
    action.onSelect();
  }, []);

  return (
    <div className="fraud-incident-menu" ref={rootRef}>
      <button
        type="button"
        className="fraud-incident-menu__trigger"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        ⋮
      </button>
      {open ? (
        <div className="fraud-incident-menu__panel" role="menu">
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              role="menuitem"
              className={`fraud-incident-menu__item${action.tone === "danger" ? " fraud-incident-menu__item--danger" : ""}`}
              onClick={() => run(action)}
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export const FraudIncidentMenu = memo(FraudIncidentMenuView);
