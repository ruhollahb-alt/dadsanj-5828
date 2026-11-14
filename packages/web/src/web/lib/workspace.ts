import { emptyData, type AppData, type IndexRow, type Payment } from "./calculator";
import type { ElectronAPI } from "./desktop";

/**
 * A case holds everything that belongs to one matter: its own index archive,
 * forms and payments. Calculations are always performed against the active
 * case only, so opening another matter can never overwrite the previous one.
 */
export type CaseRecord = {
  id: string;
  name: string;
  number: string;
  createdAt: string;
  updatedAt: string;
  data: AppData;
};

export type Workspace = {
  version: number;
  activeId: string;
  cases: CaseRecord[];
};

export const WORKSPACE_VERSION = 2;
const WEB_KEY = "dadsanj-workspace-v2";
const WEB_BACKUP_KEY = "dadsanj-workspace-backup-v2";
const MAX_BACKUPS = 3;

function now(): string {
  return new Date().toISOString();
}

function makeId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `case-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
}

const text = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value : fallback;

const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
const fa = (value: number): string => String(value).replace(/\d/g, (digit) => FA_DIGITS[Number(digit)]);

function normalizeData(value: unknown): AppData {
  const raw = (value && typeof value === "object" ? value : {}) as Partial<AppData>;
  const standard = (raw.standard ?? {}) as Partial<AppData["standard"]>;
  const partial = (raw.partial ?? {}) as Partial<AppData["partial"]>;
  const installment = (raw.installment ?? {}) as Partial<AppData["installment"]>;

  const indices: IndexRow[] = Array.isArray(raw.indices)
    ? raw.indices
        .filter((row): row is IndexRow => !!row && typeof row === "object")
        .map((row) => ({ month: text(row.month), value: text(row.value) }))
        .filter((row) => row.month !== "" && row.value !== "")
    : [];

  const payments: Payment[] = Array.isArray(partial.payments)
    ? partial.payments.map((payment, i) => ({
        id: text(payment?.id) || `payment-${i + 1}`,
        date: text(payment?.date),
        amount: text(payment?.amount),
      }))
    : [];

  return {
    defaultsRevision: typeof raw.defaultsRevision === "string" ? raw.defaultsRevision : undefined,
    indices,
    standard: {
      principal: text(standard.principal),
      start: text(standard.start),
      end: text(standard.end),
    },
    partial: {
      principal: text(partial.principal),
      start: text(partial.start),
      end: text(partial.end),
      payments,
    },
    installment: {
      principal: text(installment.principal),
      start: text(installment.start),
      ruling: text(installment.ruling),
      initial: text(installment.initial),
      mode: installment.mode === "amount" ? "amount" : "count",
      value: text(installment.value),
    },
  };
}

export function makeCase(name: string, data: AppData = structuredClone(emptyData)): CaseRecord {
  const stamp = now();
  return { id: makeId(), name, number: "", createdAt: stamp, updatedAt: stamp, data };
}

export function nextCaseName(cases: CaseRecord[]): string {
  const used = new Set(cases.map((item) => item.name));
  let n = cases.length + 1;
  while (used.has(`پروندهٔ ${fa(n)}`)) n += 1;
  return `پروندهٔ ${fa(n)}`;
}

export function createWorkspace(data: AppData, name = "پروندهٔ ۱"): Workspace {
  const record = makeCase(name, data);
  return { version: WORKSPACE_VERSION, activeId: record.id, cases: [record] };
}

/** Rebuilds a valid workspace from untrusted JSON (older files, manual edits). */
export function normalizeWorkspace(value: unknown): Workspace | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as { cases?: unknown; activeId?: unknown };
  if (!Array.isArray(raw.cases)) return null;

  const seen = new Set<string>();
  const cases: CaseRecord[] = [];
  for (const item of raw.cases) {
    if (!item || typeof item !== "object") continue;
    const record = item as Partial<CaseRecord>;
    let id = text(record.id) || makeId();
    if (seen.has(id)) id = makeId();
    seen.add(id);
    const stamp = now();
    cases.push({
      id,
      name: text(record.name) || `پروندهٔ ${fa(cases.length + 1)}`,
      number: text(record.number),
      createdAt: text(record.createdAt) || stamp,
      updatedAt: text(record.updatedAt) || stamp,
      data: normalizeData(record.data),
    });
  }
  if (cases.length === 0) return null;

  const activeId = cases.some((item) => item.id === raw.activeId)
    ? String(raw.activeId)
    : cases[0].id;
  return { version: WORKSPACE_VERSION, activeId, cases };
}

export function activeCase(workspace: Workspace): CaseRecord {
  return workspace.cases.find((item) => item.id === workspace.activeId) ?? workspace.cases[0];
}

export function withCaseData(workspace: Workspace, id: string, data: AppData): Workspace {
  return {
    ...workspace,
    cases: workspace.cases.map((item) =>
      item.id === id ? { ...item, data, updatedAt: now() } : item,
    ),
  };
}

export function withCaseName(workspace: Workspace, id: string, name: string): Workspace {
  const clean = name.trim().slice(0, 80);
  if (!clean) return workspace;
  return {
    ...workspace,
    cases: workspace.cases.map((item) =>
      item.id === id ? { ...item, name: clean, updatedAt: now() } : item,
    ),
  };
}

export function addCase(workspace: Workspace, data: AppData, name?: string): Workspace {
  const record = makeCase(name ?? nextCaseName(workspace.cases), data);
  return { ...workspace, activeId: record.id, cases: [...workspace.cases, record] };
}

export function duplicateCase(workspace: Workspace, id: string): Workspace {
  const source = workspace.cases.find((item) => item.id === id);
  if (!source) return workspace;
  const stamp = now();
  const copy: CaseRecord = {
    id: makeId(),
    name: `${source.name} (کپی)`.slice(0, 80),
    number: source.number,
    createdAt: stamp,
    updatedAt: stamp,
    data: structuredClone(source.data),
  };
  return { ...workspace, activeId: copy.id, cases: [...workspace.cases, copy] };
}

export function deleteCase(workspace: Workspace, id: string): Workspace {
  if (workspace.cases.length <= 1) return workspace;
  const cases = workspace.cases.filter((item) => item.id !== id);
  const activeId =
    workspace.activeId === id ? cases[0].id : workspace.activeId;
  return { ...workspace, activeId, cases };
}

// --- Persistence ------------------------------------------------------------
// Desktop keeps one JSON workspace file in userData (written atomically by the
// main process, with rotating backups). The browser preview falls back to
// localStorage with the same rotating-backup policy.

function parse(raw: string | null): Workspace | null {
  if (!raw) return null;
  try {
    return normalizeWorkspace(JSON.parse(raw));
  } catch {
    return null;
  }
}

export async function loadWorkspace(desktop: ElectronAPI | null): Promise<Workspace | null> {
  if (desktop?.readWorkspace) return parse(await desktop.readWorkspace());
  try {
    return parse(localStorage.getItem(WEB_KEY));
  } catch {
    return null;
  }
}

export async function saveWorkspace(desktop: ElectronAPI | null, workspace: Workspace): Promise<void> {
  const content = JSON.stringify(workspace);
  if (desktop?.writeWorkspace) {
    await desktop.writeWorkspace(content);
    return;
  }
  const previous = localStorage.getItem(WEB_KEY);
  if (previous) {
    try {
      const backups = JSON.parse(localStorage.getItem(WEB_BACKUP_KEY) ?? "[]") as unknown;
      const list = Array.isArray(backups) ? backups.filter((item): item is string => typeof item === "string") : [];
      list.unshift(previous);
      localStorage.setItem(WEB_BACKUP_KEY, JSON.stringify(list.slice(0, MAX_BACKUPS)));
    } catch {
      // A broken backup list must never block the actual save.
    }
  }
  localStorage.setItem(WEB_KEY, content);
}

export async function restoreWorkspaceBackup(desktop: ElectronAPI | null): Promise<Workspace | null> {
  if (desktop?.restoreWorkspaceBackup) {
    return parse(await desktop.restoreWorkspaceBackup());
  }
  try {
    const raw = localStorage.getItem(WEB_BACKUP_KEY);
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    if (!Array.isArray(list) || list.length === 0) return null;
    const [latest, ...rest] = list.filter((item): item is string => typeof item === "string");
    if (!latest) return null;
    localStorage.setItem(WEB_BACKUP_KEY, JSON.stringify(rest));
    return parse(latest);
  } catch {
    return null;
  }
}
