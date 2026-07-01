"use client";

import { memo, useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import type { SystemSetting, SystemSettingAuditEntry } from "@sonafrik/types";
import {
  CRITICALITY_LABELS,
  getBusinessRuleMeta,
  isCriticalRule,
  matchesBusinessRuleSearch,
} from "../lib/businessRulesDictionary";
import {
  formatBusinessRuleValue,
  formatRelativeDate,
  parseBusinessRuleDraft,
} from "../lib/formatBusinessRuleValue";
import {
  restoreSystemSettingAction,
  updateSystemSettingAction,
} from "../actions/admin.actions";

export type BusinessRulesPageProps = {
  settings: SystemSetting[];
  auditHistory: SystemSettingAuditEntry[];
  actorLabels: Record<string, string>;
};

type ModalMode = "history" | "compare" | "edit" | null;

type CardProps = {
  setting: SystemSetting;
  meta: ReturnType<typeof getBusinessRuleMeta>;
  actorLabel: string;
  history: SystemSettingAuditEntry[];
  onOpenHistory: () => void;
  onOpenCompare: () => void;
  onOpenEdit: () => void;
  onRestore: (auditId: string) => void;
  isRestoring: boolean;
};

const BusinessRuleCard = memo(function BusinessRuleCard({
  setting,
  meta,
  actorLabel,
  history,
  onOpenHistory,
  onOpenCompare,
  onOpenEdit,
  onRestore,
  isRestoring,
}: CardProps) {
  const crit = CRITICALITY_LABELS[meta.criticality];
  const lastEntry = history[0];

  return (
    <article className="br-card" aria-labelledby={`br-title-${setting.id}`}>
      <header className="br-card__header">
        <div className="br-card__title-row">
          <span className="br-card__icon" aria-hidden>
            {meta.icon}
          </span>
          <h3 className="br-card__title" id={`br-title-${setting.id}`}>
            {meta.label}
          </h3>
        </div>
        <span className={`br-criticality ${crit.className}`}>
          {crit.badge} {crit.label}
        </span>
      </header>

      <p className="br-card__explanation">{meta.explanation}</p>

      <div className="br-card__value-row">
        <span className="br-card__value-label">Valeur actuelle</span>
        <span className="br-card__value">{formatBusinessRuleValue(setting.value)}</span>
      </div>

      <div className="br-card__modules">
        <span className="br-card__modules-label">Utilisée par :</span>
        {meta.modules.map((mod) => (
          <Link key={mod.id} href={mod.href} className="br-module-chip">
            {mod.label}
          </Link>
        ))}
      </div>

      <p className="br-card__meta">
        Dernière modification : {formatRelativeDate(setting.updated_at)}
        {actorLabel ? ` · ${actorLabel}` : null}
        {lastEntry ? (
          <>
            <br />
            Avant : {formatBusinessRuleValue(lastEntry.previousValue)} → Après :{" "}
            {formatBusinessRuleValue(lastEntry.newValue)}
          </>
        ) : null}
      </p>

      <div className="br-card__actions">
        <button type="button" className="br-btn" onClick={onOpenHistory}>
          Historique
        </button>
        <button type="button" className="br-btn" onClick={onOpenCompare} disabled={!lastEntry}>
          Comparer
        </button>
        {lastEntry ? (
          <button
            type="button"
            className="br-btn"
            disabled={isRestoring}
            onClick={() => onRestore(lastEntry.id)}
          >
            Restaurer
          </button>
        ) : null}
        <button type="button" className="br-btn br-btn--primary" onClick={onOpenEdit}>
          Modifier
        </button>
      </div>
    </article>
  );
});

export function AdminBusinessRulesCenter({
  settings,
  auditHistory,
  actorLabels,
}: BusinessRulesPageProps) {
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [modal, setModal] = useState<{ mode: ModalMode; setting: SystemSetting | null }>({
    mode: null,
    setting: null,
  });
  const [draft, setDraft] = useState("");
  const [motive, setMotive] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmCritical, setConfirmCritical] = useState(false);
  const [isPending, startTransition] = useTransition();

  const historyByKey = useMemo(() => {
    const map = new Map<string, SystemSettingAuditEntry[]>();
    for (const entry of auditHistory) {
      if (!entry.settingKey) continue;
      const list = map.get(entry.settingKey) ?? [];
      list.push(entry);
      map.set(entry.settingKey, list);
    }
    return map;
  }, [auditHistory]);

  const filtered = useMemo(() => {
    return settings.filter((s) => {
      const meta = getBusinessRuleMeta(s.key, s.description);
      return matchesBusinessRuleSearch(s.key, meta, s.description, query);
    });
  }, [settings, query]);

  const summary = useMemo(() => {
    const critical = settings.filter((s) => isCriticalRule(s.key)).length;
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const modifiedWeek = settings.filter((s) => new Date(s.updated_at).getTime() >= weekAgo).length;
    const lastSave = settings.reduce((max, s) => Math.max(max, new Date(s.updated_at).getTime()), 0);
    return {
      total: settings.length,
      critical,
      modifiedWeek,
      lastSave: lastSave ? formatRelativeDate(new Date(lastSave).toISOString()) : "—",
    };
  }, [settings]);

  const resolveActor = useCallback(
    (id: string | null) => {
      if (!id) return "Système";
      return actorLabels[id] ?? "Administrateur";
    },
    [actorLabels],
  );

  const closeModal = () => {
    setModal({ mode: null, setting: null });
    setDraft("");
    setMotive("");
    setError(null);
    setConfirmCritical(false);
  };

  const saveEdit = () => {
    if (!modal.setting) return;
    const key = modal.setting.key;
    if (isCriticalRule(key) && !confirmCritical) {
      setConfirmCritical(true);
      return;
    }
    setError(null);
    startTransition(async () => {
      const parsed = parseBusinessRuleDraft(draft, modal.setting!.value);
      const payload =
        typeof parsed === "object" && parsed !== null
          ? JSON.stringify(parsed)
          : String(parsed);
      const result = await updateSystemSettingAction(
        key,
        payload,
        motive.trim() || undefined,
      );
      if (result.error) {
        setError(result.error);
        return;
      }
      setToast("Règle enregistrée avec succès.");
      closeModal();
      setTimeout(() => setToast(null), 3000);
    });
  };

  const handleRestore = (setting: SystemSetting, auditId: string) => {
    startTransition(async () => {
      const result = await restoreSystemSettingAction(setting.key, auditId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setToast("Version restaurée.");
      setTimeout(() => setToast(null), 3000);
    });
  };

  const activeSetting = modal.setting;
  const activeMeta = activeSetting
    ? getBusinessRuleMeta(activeSetting.key, activeSetting.description)
    : null;
  const activeHistory = activeSetting ? (historyByKey.get(activeSetting.key) ?? []) : [];

  useEffect(() => {
    if (!modal.mode) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modal.mode]);

  return (
    <div className="br-page">
      <section className="br-summary" aria-label="Synthèse configuration">
        <h2 className="br-summary__title">Configuration SONAFRIK</h2>
        <div>
          <p className="br-summary__stat-value">{summary.total}</p>
          <p className="br-summary__stat-label">Règles actives</p>
        </div>
        <div>
          <p className="br-summary__stat-value">{summary.critical}</p>
          <p className="br-summary__stat-label">Règles critiques</p>
        </div>
        <div>
          <p className="br-summary__stat-value">{summary.modifiedWeek}</p>
          <p className="br-summary__stat-label">Modifiées cette semaine</p>
        </div>
        <div>
          <p className="br-summary__stat-value" style={{ fontSize: "0.875rem" }}>
            {summary.lastSave}
          </p>
          <p className="br-summary__stat-label">Dernière sauvegarde</p>
        </div>
        <p className="br-summary__sync">✓ Synchronisation · Aucun conflit détecté</p>
      </section>

      {toast ? <div className="br-toast" role="status">{toast}</div> : null}

      <div className="br-search">
        <span className="br-search__icon" aria-hidden>
          🔍
        </span>
        <input
          type="search"
          className="br-search__input"
          placeholder="Rechercher une règle (revenu, stream, premium…)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Rechercher une règle métier"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="br-empty">Aucune règle ne correspond à votre recherche.</p>
      ) : (
        <div className="br-grid" role="list">
          {filtered.map((setting) => {
            const meta = getBusinessRuleMeta(setting.key, setting.description);
            const history = historyByKey.get(setting.key) ?? [];
            return (
              <BusinessRuleCard
                key={setting.id}
                setting={setting}
                meta={meta}
                actorLabel={resolveActor(setting.updated_by)}
                history={history}
                onOpenHistory={() => setModal({ mode: "history", setting })}
                onOpenCompare={() => setModal({ mode: "compare", setting })}
                onOpenEdit={() => {
                  setDraft(formatBusinessRuleValue(setting.value));
                  setModal({ mode: "edit", setting });
                }}
                onRestore={(auditId) => handleRestore(setting, auditId)}
                isRestoring={isPending}
              />
            );
          })}
        </div>
      )}

      {modal.mode && activeSetting && activeMeta ? (
        <div
          className="br-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="br-modal-title"
          onClick={closeModal}
        >
          <div className="br-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="br-modal__title" id="br-modal-title">
              {modal.mode === "history" && `Historique — ${activeMeta.label}`}
              {modal.mode === "compare" && `Comparer — ${activeMeta.label}`}
              {modal.mode === "edit" && `Modifier — ${activeMeta.label}`}
            </h2>

            {modal.mode === "history" ? (
              <div className="br-history-list">
                {activeHistory.length === 0 ? (
                  <p className="br-empty">Aucun historique enregistré pour cette règle.</p>
                ) : (
                  activeHistory.map((entry) => (
                    <div key={entry.id} className="br-history-item">
                      <strong>{formatRelativeDate(entry.createdAt)}</strong>
                      <br />
                      Par {resolveActor(entry.actorId)}
                      <br />
                      {formatBusinessRuleValue(entry.previousValue)} →{" "}
                      {formatBusinessRuleValue(entry.newValue)}
                      {entry.motive ? (
                        <>
                          <br />
                          Motif : {entry.motive}
                        </>
                      ) : null}
                      <div className="br-card__actions" style={{ marginTop: "0.5rem" }}>
                        <button
                          type="button"
                          className="br-btn"
                          disabled={isPending}
                          onClick={() => handleRestore(activeSetting, entry.id)}
                        >
                          Restaurer cette version
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : null}

            {modal.mode === "compare" && activeHistory[0] ? (
              <div className="br-compare-grid">
                <div className="br-compare-col">
                  <strong>Avant</strong>
                  <p>{formatBusinessRuleValue(activeHistory[0].previousValue)}</p>
                  <small>{formatRelativeDate(activeHistory[0].createdAt)}</small>
                </div>
                <div className="br-compare-col">
                  <strong>Après</strong>
                  <p>{formatBusinessRuleValue(activeHistory[0].newValue)}</p>
                  <small>{resolveActor(activeHistory[0].actorId)}</small>
                </div>
              </div>
            ) : null}

            {modal.mode === "edit" ? (
              <>
                {confirmCritical && isCriticalRule(activeSetting.key) ? (
                  <div className="br-alert" role="alert">
                    <p className="br-alert__title">Attention — impact critique</p>
                    <p>Cette modification impactera immédiatement :</p>
                    <ul>
                      {activeMeta.modules.map((m) => (
                        <li key={m.id}>{m.label}</li>
                      ))}
                    </ul>
                    <p>Confirmez pour enregistrer.</p>
                  </div>
                ) : null}
                <label className="br-card__value-label" htmlFor="br-edit-value">
                  Nouvelle valeur
                </label>
                <input
                  id="br-edit-value"
                  className="br-edit-input"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  disabled={isPending}
                />
                <label className="br-card__value-label" htmlFor="br-edit-motive" style={{ marginTop: "0.75rem" }}>
                  Motif (optionnel)
                </label>
                <input
                  id="br-edit-motive"
                  className="br-edit-input"
                  value={motive}
                  onChange={(e) => setMotive(e.target.value)}
                  disabled={isPending}
                  placeholder="Ex. Ajustement lancement beta"
                />
                {error ? <p className="br-error">{error}</p> : null}
                <div className="br-card__actions" style={{ marginTop: "1rem" }}>
                  <button type="button" className="br-btn" onClick={closeModal} disabled={isPending}>
                    Annuler
                  </button>
                  <button
                    type="button"
                    className="br-btn br-btn--primary"
                    onClick={saveEdit}
                    disabled={isPending}
                  >
                    {confirmCritical ? "Confirmer l'enregistrement" : "Enregistrer"}
                  </button>
                </div>
              </>
            ) : null}

            {modal.mode !== "edit" ? (
              <div className="br-card__actions" style={{ marginTop: "1rem" }}>
                <button type="button" className="br-btn" onClick={closeModal}>
                  Fermer
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
