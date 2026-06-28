const STORAGE_KEY = "sonafrik-fraud-incident-admin-v1";

export interface FraudIncidentAdminState {
  treated: boolean;
  archived: boolean;
  hidden: boolean;
  notes: string[];
  updatedAt: string;
}

type Store = Record<string, FraudIncidentAdminState>;

function readStore(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Store;
  } catch {
    return {};
  }
}

function writeStore(store: Store): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function getFraudIncidentState(id: string): FraudIncidentAdminState | null {
  return readStore()[id] ?? null;
}

export function patchFraudIncidentState(
  id: string,
  patch: Partial<Omit<FraudIncidentAdminState, "updatedAt">>,
): FraudIncidentAdminState {
  const store = readStore();
  const prev = store[id] ?? { treated: false, archived: false, hidden: false, notes: [] };
  const next: FraudIncidentAdminState = {
    ...prev,
    ...patch,
    notes: patch.notes ?? prev.notes,
    updatedAt: new Date().toISOString(),
  };
  store[id] = next;
  writeStore(store);
  return next;
}

export function bulkPatchFraudIncidents(
  ids: string[],
  patch: Partial<Omit<FraudIncidentAdminState, "updatedAt">>,
): void {
  const store = readStore();
  const now = new Date().toISOString();
  for (const id of ids) {
    const prev = store[id] ?? { treated: false, archived: false, hidden: false, notes: [] };
    store[id] = {
      ...prev,
      ...patch,
      notes: patch.notes ?? prev.notes,
      updatedAt: now,
    };
  }
  writeStore(store);
}

export function addFraudIncidentNote(id: string, note: string): void {
  const trimmed = note.trim();
  if (!trimmed) return;
  const store = readStore();
  const prev = store[id] ?? { treated: false, archived: false, hidden: false, notes: [] };
  store[id] = {
    ...prev,
    notes: [...prev.notes, trimmed],
    updatedAt: new Date().toISOString(),
  };
  writeStore(store);
}

export function loadAllFraudIncidentStates(): Store {
  return readStore();
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
