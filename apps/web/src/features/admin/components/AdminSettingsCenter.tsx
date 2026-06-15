"use client";

import { useState, useTransition } from "react";
import type { SettingCategory, SystemSetting } from "@sonafrik/types";
import { SETTING_CATEGORY_LABELS } from "@sonafrik/types";
import { updateSystemSettingAction } from "../actions/admin.actions";

interface Props {
  settings: SystemSetting[];
}

function displayValue(v: unknown): string {
  if (typeof v === "string") return v;
  return JSON.stringify(v);
}

function SettingRow({ setting }: { setting: SystemSetting }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(displayValue(setting.value));
  const [saved, setSaved] = useState(displayValue(setting.value));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function save() {
    if (draft === saved) { setEditing(false); return; }
    setError(null);
    startTransition(async () => {
      const result = await updateSystemSettingAction(setting.key, draft);
      if (result.error) {
        setError(result.error);
        setDraft(saved);
      } else {
        setSaved(draft);
      }
      setEditing(false);
    });
  }

  return (
    <div
      className="grid grid-cols-[1fr_auto] items-start gap-4 rounded-lg p-4"
      style={{ backgroundColor: "#1A1A1A", border: "1px solid #2A2A2A" }}
    >
      <div className="min-w-0">
        <p className="font-mono text-sm font-semibold" style={{ color: "#FFFFFF" }}>
          {setting.key}
        </p>
        {setting.description ? (
          <p className="mt-0.5 text-xs" style={{ color: "#555555" }}>
            {setting.description}
          </p>
        ) : null}
        {error ? (
          <p className="mt-1 text-xs" style={{ color: "#FF6B6B" }}>
            {error}
          </p>
        ) : null}
      </div>

      <div className="shrink-0">
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={draft}
              disabled={isPending}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") save();
                if (e.key === "Escape") { setDraft(saved); setEditing(false); }
              }}
              onBlur={save}
              className="rounded px-2 py-1 font-mono text-sm"
              style={{
                backgroundColor: "#0D0D0D",
                color: "#FFFFFF",
                border: "1px solid #FFC20E",
                outline: "none",
                width: "120px",
              }}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded px-3 py-1 font-mono text-sm transition-colors"
            style={{
              backgroundColor: "#0D0D0D",
              color: "#FFC20E",
              border: "1px solid #2A2A2A",
              cursor: "pointer",
            }}
          >
            {saved}
          </button>
        )}
      </div>
    </div>
  );
}

export function AdminSettingsCenter({ settings }: Props) {
  const byCategory = settings.reduce<Record<string, SystemSetting[]>>((acc, s) => {
    const cat = s.category ?? "general";
    (acc[cat] ??= []).push(s);
    return acc;
  }, {});

  const categoryOrder: SettingCategory[] = ["streaming", "wallet", "creator", "admin", "general"];

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold" style={{ color: "#FFFFFF" }}>
        Paramètres système
      </h1>

      <p className="mb-6 text-xs" style={{ color: "#555555" }}>
        Cliquez sur une valeur pour la modifier. Appuyez sur Entrée ou cliquez ailleurs pour sauvegarder.
      </p>

      <div className="space-y-8">
        {categoryOrder
          .filter((cat) => byCategory[cat]?.length)
          .map((cat) => (
            <section key={cat}>
              <h2
                className="mb-3 text-xs font-semibold uppercase tracking-widest"
                style={{ color: "#FFC20E" }}
              >
                {SETTING_CATEGORY_LABELS[cat]}
              </h2>
              <div className="space-y-2">
                {byCategory[cat]!.map((s) => (
                  <SettingRow key={s.key} setting={s} />
                ))}
              </div>
            </section>
          ))}
      </div>

      {settings.length === 0 ? (
        <p className="py-12 text-center text-sm" style={{ color: "#555555" }}>
          Aucun paramètre défini.
        </p>
      ) : null}
    </div>
  );
}
