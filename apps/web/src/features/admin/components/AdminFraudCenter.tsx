"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  AdminFraudIncident,
  AdminFraudIncidentsPage,
  AdminFraudSupervisionStats,
} from "@sonafrik/api/admin";
import { useAdminFraudMetrics } from "@/features/shared/ldse/admin/AdminLdseProvider";
import { useLdseEvent } from "@/features/shared/ldse/LdseProvider";
import { ADMIN_LDSE_EVENTS } from "@/features/shared/ldse/admin/admin-ldse-config";
import { loadFraudIncidentsPageAction } from "../actions/admin-fraud.actions";
import { fetchFraudSupervisionStats } from "../lib/adminLdseClient";
import {
  addFraudIncidentNote,
  bulkPatchFraudIncidents,
  exportIncidentIdsAsCsv,
  loadAllFraudIncidentStates,
  patchFraudIncidentState,
  type FraudIncidentAdminState,
} from "../lib/fraud/fraudIncidentStore";
import {
  DEFAULT_FRAUD_FILTERS,
  useFraudIncidentFilters,
  type FraudFilterState,
} from "../lib/fraud/useFraudIncidentFilters";
import { buildIncidentHeadline } from "../lib/fraud/humanizeFraudIncident";
import { FraudSupervisionDashboard } from "./fraud/FraudSupervisionDashboard";
import { FraudIncidentToolbar } from "./fraud/FraudIncidentToolbar";
import { FraudBulkActionBar } from "./fraud/FraudBulkActionBar";
import { FraudIncidentCard } from "./fraud/FraudIncidentCard";
import { FraudIncidentDrawer } from "./fraud/FraudIncidentDrawer";
import type { FraudMenuAction } from "./fraud/FraudIncidentMenu";

const PAGE_SIZE = 20;
const SERVER_PAGE = 200;

interface Props {
  initialPage: AdminFraudIncidentsPage;
  stats: AdminFraudSupervisionStats;
  initialFilters?: FraudFilterState;
}

export function AdminFraudCenter({ initialPage, stats, initialFilters }: Props) {
  const liveFraudMetrics = useAdminFraudMetrics({
    totalFlagged: stats.totalFlagged,
    flaggedThisMonth: stats.flaggedThisMonth,
    flaggedToday: stats.flaggedToday,
  });
  const [supervisionStats, setSupervisionStats] = useState(stats);
  const [incidents, setIncidents] = useState<AdminFraudIncident[]>(initialPage.items);
  const [totalRemote, setTotalRemote] = useState(initialPage.total);
  const [remoteOffset, setRemoteOffset] = useState(initialPage.items.length);
  const [loadingMoreRemote, setLoadingMoreRemote] = useState(false);

  const [filters, setFilters] = useState<FraudFilterState>(initialFilters ?? DEFAULT_FRAUD_FILTERS);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [adminStates, setAdminStates] = useState<Record<string, FraudIncidentAdminState>>({});
  const [drawerIncident, setDrawerIncident] = useState<AdminFraudIncident | null>(null);

  /** localStorage après hydratation — évite mismatch SSR (200 vs N filtrés). */
  useEffect(() => {
    setAdminStates(loadAllFraudIncidentStates());
  }, []);

  useEffect(() => {
    setTotalRemote(liveFraudMetrics.totalFlagged);
  }, [liveFraudMetrics.totalFlagged]);

  const refreshLiveData = useCallback(() => {
    void Promise.all([
      loadFraudIncidentsPageAction(0, SERVER_PAGE),
      fetchFraudSupervisionStats(),
    ]).then(([page, nextStats]) => {
      setIncidents(page.items);
      setRemoteOffset(page.items.length);
      setTotalRemote(page.total);
      setSupervisionStats(nextStats);
    });
  }, []);

  useLdseEvent(ADMIN_LDSE_EVENTS.snapshotRefreshed, refreshLiveData);
  useLdseEvent(ADMIN_LDSE_EVENTS.fraudUpdated, refreshLiveData);

  const mergedStats = useMemo(
    () => ({
      ...supervisionStats,
      totalFlagged: liveFraudMetrics.totalFlagged,
      totalIncidents: liveFraudMetrics.totalFlagged,
      flaggedToday: liveFraudMetrics.flaggedToday,
      fraudDetectedToday: liveFraudMetrics.flaggedToday,
      suspicionsToday: liveFraudMetrics.flaggedToday,
      flaggedThisMonth: liveFraudMetrics.flaggedThisMonth,
    }),
    [
      supervisionStats,
      liveFraudMetrics.totalFlagged,
      liveFraudMetrics.flaggedToday,
      liveFraudMetrics.flaggedThisMonth,
    ],
  );

  const filtered = useFraudIncidentFilters(incidents, filters, adminStates);
  const visible = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);

  const refreshStates = useCallback(() => {
    setAdminStates(loadAllFraudIncidentStates());
  }, []);

  const patchOne = useCallback(
    (id: string, patch: Partial<Omit<FraudIncidentAdminState, "updatedAt">>) => {
      patchFraudIncidentState(id, patch);
      refreshStates();
    },
    [refreshStates],
  );

  const buildMenuActions = useCallback(
    (incident: AdminFraudIncident): FraudMenuAction[] => [
      { id: "details", label: "Voir les détails", onSelect: () => setDrawerIncident(incident) },
      { id: "session", label: "Voir la session", onSelect: () => setDrawerIncident(incident) },
      { id: "user", label: "Voir l'utilisateur", onSelect: () => { window.location.href = "/admin/users"; } },
      {
        id: "artist",
        label: "Voir l'artiste",
        onSelect: () => {
          if (incident.artist_creator_id) {
            window.location.href = `/listen/artist/${incident.artist_creator_id}`;
          }
        },
      },
      {
        id: "track",
        label: "Voir les écoutes",
        onSelect: () => {
          window.location.href = `/listen/track/${incident.track_id}`;
        },
      },
      {
        id: "note",
        label: "Ajouter une note",
        onSelect: () => {
          const note = window.prompt("Note interne :");
          if (note) {
            addFraudIncidentNote(incident.id, note);
            refreshStates();
          }
        },
      },
      {
        id: "treated",
        label: "Marquer traité",
        onSelect: () => patchOne(incident.id, { treated: true }),
      },
      { id: "hide", label: "Masquer", onSelect: () => patchOne(incident.id, { hidden: true }) },
      { id: "archive", label: "Archiver", onSelect: () => patchOne(incident.id, { archived: true }) },
      {
        id: "export",
        label: "Exporter",
        onSelect: () => {
          const h = buildIncidentHeadline(incident.fraud_flags, incident.is_valid_listen);
          exportIncidentIdsAsCsv([incident.id], [{ id: incident.id, title: h.title }]);
        },
      },
      {
        id: "delete",
        label: "Supprimer",
        tone: "danger",
        onSelect: () => patchOne(incident.id, { hidden: true, archived: true }),
      },
    ],
    [patchOne, refreshStates],
  );

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAllVisible = useCallback(() => {
    setSelectedIds(new Set(visible.map((i) => i.id)));
  }, [visible]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const bulk = useCallback(
    (patch: Partial<Omit<FraudIncidentAdminState, "updatedAt">>) => {
      bulkPatchFraudIncidents([...selectedIds], patch);
      refreshStates();
      clearSelection();
    },
    [selectedIds, refreshStates, clearSelection],
  );

  const loadMoreVisible = () => setVisibleCount((c) => c + PAGE_SIZE);

  const loadOlderRemote = async () => {
    if (remoteOffset >= totalRemote || loadingMoreRemote) return;
    setLoadingMoreRemote(true);
    try {
      const page = await loadFraudIncidentsPageAction(remoteOffset, SERVER_PAGE);
      setIncidents((prev) => {
        const known = new Set(prev.map((p) => p.id));
        return [...prev, ...page.items.filter((i) => !known.has(i.id))];
      });
      setRemoteOffset((o) => o + page.items.length);
      setTotalRemote(page.total);
    } finally {
      setLoadingMoreRemote(false);
    }
  };

  const canLoadMoreVisible = visibleCount < filtered.length;
  const canLoadOlderRemote = remoteOffset < totalRemote;

  return (
    <div className="fraud-supervision">
      <FraudSupervisionDashboard stats={mergedStats} />

      <FraudIncidentToolbar
        filters={filters}
        onChange={(patch) => {
          setFilters((f) => ({ ...f, ...patch }));
          setVisibleCount(PAGE_SIZE);
        }}
        resultCount={filtered.length}
        totalLoaded={incidents.length}
        ssotTotal={mergedStats.totalIncidents}
      />

      <FraudBulkActionBar
        selectedCount={selectedIds.size}
        onSelectAll={selectAllVisible}
        onClearSelection={clearSelection}
        onArchive={() => bulk({ archived: true })}
        onMarkTreated={() => bulk({ treated: true })}
        onHide={() => bulk({ hidden: true })}
        onExport={() => {
          const rows = incidents.map((i) => {
            const h = buildIncidentHeadline(i.fraud_flags, i.is_valid_listen);
            return { id: i.id, title: h.title };
          });
          exportIncidentIdsAsCsv([...selectedIds], rows);
        }}
        onDelete={() => bulk({ hidden: true, archived: true })}
        onAddNote={() => {
          const note = window.prompt("Note à ajouter aux incidents sélectionnés :");
          if (!note) return;
          for (const id of selectedIds) addFraudIncidentNote(id, note);
          refreshStates();
          clearSelection();
        }}
      />

      {filtered.length === 0 ? (
        <div className="fraud-empty">
          <p className="fraud-empty__emoji" aria-hidden>
            ✅
          </p>
          <p className="fraud-empty__title">Aucun incident à afficher</p>
          <p className="fraud-empty__sub">
            Les filtres actuels ne correspondent à aucune session signalée.
          </p>
        </div>
      ) : (
        <div className="fraud-incident-list">
          {visible.map((incident) => (
            <FraudIncidentCard
              key={incident.id}
              incident={incident}
              adminState={adminStates[incident.id] ?? null}
              selected={selectedIds.has(incident.id)}
              onToggleSelect={() => toggleSelect(incident.id)}
              onOpen={() => setDrawerIncident(incident)}
              menuActions={buildMenuActions(incident)}
            />
          ))}
        </div>
      )}

      <div className="fraud-pagination">
        {canLoadMoreVisible ? (
          <button type="button" className="admin-btn admin-btn-ghost" onClick={loadMoreVisible}>
            Charger plus ({Math.min(PAGE_SIZE, filtered.length - visibleCount)} suivants)
          </button>
        ) : null}
        {canLoadOlderRemote ? (
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            disabled={loadingMoreRemote}
            onClick={() => void loadOlderRemote()}
          >
            {loadingMoreRemote ? "Chargement…" : "Voir les anciens incidents"}
          </button>
        ) : null}
        <p className="fraud-pagination__info">
          {visible.length} / {filtered.length} affichés · {totalRemote} incidents en base
        </p>
      </div>

      <FraudIncidentDrawer
        incident={drawerIncident}
        adminState={drawerIncident ? (adminStates[drawerIncident.id] ?? null) : null}
        open={drawerIncident !== null}
        onClose={() => setDrawerIncident(null)}
        onMarkTreated={() => {
          if (drawerIncident) patchOne(drawerIncident.id, { treated: true });
        }}
        onArchive={() => {
          if (drawerIncident) patchOne(drawerIncident.id, { archived: true });
        }}
        onHide={() => {
          if (drawerIncident) patchOne(drawerIncident.id, { hidden: true });
        }}
        onAddNote={(note) => {
          if (drawerIncident) {
            addFraudIncidentNote(drawerIncident.id, note);
            refreshStates();
          }
        }}
      />
    </div>
  );
}
