import {
  addFraudReviewNoteAction,
  bulkPatchFraudReviewStatesAction,
  loadFraudReviewStatesAction,
  patchFraudReviewStateAction,
} from "../../actions/admin-fraud.actions";

export interface FraudIncidentAdminState {
  treated: boolean;
  archived: boolean;
  hidden: boolean;
  notes: string[];
  updatedAt: string;
}

type Store = Record<string, FraudIncidentAdminState>;

/** État local optimiste — synchronisé avec admin_fraud_reviews via Server Actions. */
let optimisticStore: Store = {};

export function getFraudIncidentState(id: string): FraudIncidentAdminState | null {
  return optimisticStore[id] ?? null;
}

export function patchFraudIncidentState(
  id: string,
  patch: Partial<Omit<FraudIncidentAdminState, "updatedAt">>,
): FraudIncidentAdminState {
  const prev = optimisticStore[id] ?? { treated: false, archived: false, hidden: false, notes: [] };
  const next: FraudIncidentAdminState = {
    ...prev,
    ...patch,
    notes: patch.notes ?? prev.notes,
    updatedAt: new Date().toISOString(),
  };
  optimisticStore = { ...optimisticStore, [id]: next };
  void patchFraudReviewStateAction(id, patch).catch(() => undefined);
  return next;
}

export function bulkPatchFraudIncidents(
  ids: string[],
  patch: Partial<Omit<FraudIncidentAdminState, "updatedAt">>,
): void {
  const now = new Date().toISOString();
  const nextStore = { ...optimisticStore };
  for (const id of ids) {
    const prev = nextStore[id] ?? { treated: false, archived: false, hidden: false, notes: [] };
    nextStore[id] = {
      ...prev,
      ...patch,
      notes: patch.notes ?? prev.notes,
      updatedAt: now,
    };
  }
  optimisticStore = nextStore;
  void bulkPatchFraudReviewStatesAction(ids, patch).catch(() => undefined);
}

export function addFraudIncidentNote(id: string, note: string): void {
  const trimmed = note.trim();
  if (!trimmed) return;
  const prev = optimisticStore[id] ?? { treated: false, archived: false, hidden: false, notes: [] };
  const notes = [...prev.notes, trimmed];
  optimisticStore = {
    ...optimisticStore,
    [id]: { ...prev, notes, updatedAt: new Date().toISOString() },
  };
  void addFraudReviewNoteAction(id, trimmed).catch(() => undefined);
}

export async function hydrateFraudIncidentStatesFromDb(): Promise<Store> {
  try {
    const remote = await loadFraudReviewStatesAction();
    optimisticStore = remote;
    return remote;
  } catch {
    return optimisticStore;
  }
}

export function loadAllFraudIncidentStates(): Store {
  return optimisticStore;
}

export function exportIncidentIdsAsCsv(ids: string[], rows: { id: string; title: string }[]): void {
  const header = "id,titre\n";
  const body = rows
    .filter((r) => ids.includes(r.id))
    .map((r) => `${r.id},"${r.title.replace(/"/g, '""')}"`)
    .join("\n");
  const blob = new Blob([header + body], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `sonafrik-incidents-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
