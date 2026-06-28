"use client";

import { useEffect, useState } from "react";
import { VALID_LISTEN_EVENT } from "../lib/validListenFeedback";

const TOAST_MS = 3_200;

export function ValidListenToast() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const onValidListen = () => {
      setVisible(true);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setVisible(false), TOAST_MS);
    };

    window.addEventListener(VALID_LISTEN_EVENT, onValidListen as EventListener);
    return () => {
      window.removeEventListener(VALID_LISTEN_EVENT, onValidListen as EventListener);
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="valid-listen-toast" role="status" aria-live="polite">
      <span className="valid-listen-toast__icon" aria-hidden="true">
        ✓
      </span>
      <span className="valid-listen-toast__text">Écoute validée — comptée pour l&apos;artiste</span>
    </div>
  );
}
