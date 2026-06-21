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
      style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-elevated)" }}
    >
      <div className="min-w-0">
        <p className="font-mono text-sm font-semibold" style={{ color: "var(--color-texte-principal)" }}>
          {setting.key}
        </p>
        {setting.description ? (
          <p className="mt-0.5 text-xs" style={{ color: "var(--color-texte-desactive)" }}>
            {setting.description}
          </p>
        ) : null}
        {error ? (
          <p className="mt-1 text-xs" style={{ color: "var(--color-erreur)" }}>
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
                backgroundColor: "var(--color-noir-profond)",
                color: "var(--color-texte-principal)",
                border: "1px solid var(--color-or-solaire)",
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
              backgroundColor: "var(--color-noir-profond)",
              color: "var(--color-or-solaire)",
              border: "1px solid var(--color-elevated)",
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
      <h1 className="mb-6 text-xl font-semibold" style={{ color: "var(--color-texte-principal)" }}>
        Paramètres système
      </h1>

      <p className="mb-6 text-xs" style={{ color: "var(--color-texte-desactive)" }}>
        Cliquez sur une valeur pour la modifier. Appuyez sur Entrée ou cliquez ailleurs pour sauvegarder.
      </p>

      <div className="space-y-8">
        {categoryOrder
          .filter((cat) => byCategory[cat]?.length)
          .map((cat) => (
            <section key={cat}>
              <h2
                className="mb-3 text-xs font-semibold uppercase tracking-widest"
                style={{ color: "var(--color-or-solaire)" }}
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
        <p className="py-12 text-center text-sm" style={{ color: "var(--color-texte-desactive)" }}>
          Aucun paramètre défini.
        </p>
      ) : null}
    </div>
  );
}
