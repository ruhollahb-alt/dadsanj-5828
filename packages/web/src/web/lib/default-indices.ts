import { getIndex, YEARS } from "./cpi";
import { emptyData, parseMonth, type AppData, type IndexRow } from "./calculator";

// Full Central Bank of Iran series, base 1395 = 100, coverage 1375/01–1405/12.
// The numbers live in ./cpi.ts (the calculation engine) so there is exactly one
// source of truth; this module only adapts them to the UI's row model.
export const DEFAULT_INDICES_REVISION = "cbi-1395-1375-1405-v2";
export const INDEX_SOURCE_URL = "https://www.cbi.ir/";
export const INDEX_TABLE_URL = "https://www.cbi.ir/";

export const defaultIndices: IndexRow[] = YEARS.flatMap((year) =>
  Array.from({ length: 12 }, (_, i) => {
    const entry = getIndex({ year, month: i + 1 });
    if (!entry) return null;
    return {
      month: `${year}/${String(i + 1).padStart(2, "0")}`,
      value: String(entry.level),
    };
  }).filter((row): row is IndexRow => row !== null),
);

const reference = new Map(
  defaultIndices.map((row) => [row.month, Number(row.value)]),
);

export function matchesReference(row: IndexRow): boolean {
  try {
    return reference.get(parseMonth(row.month)) === Number(row.value);
  } catch {
    return false;
  }
}

// Missing-only merge: never replace the user's value, forms or payments.
export function addMissingDefaults(data: AppData): AppData {
  const existing = new Set(
    data.indices.map((row) => {
      try {
        return parseMonth(row.month);
      } catch {
        return row.month;
      }
    }),
  );
  return {
    ...data,
    defaultsRevision: DEFAULT_INDICES_REVISION,
    indices: [
      ...data.indices,
      ...defaultIndices
        .filter((row) => !existing.has(row.month))
        .map((row) => ({ ...row })),
    ],
  };
}

export function initializeData(stored?: AppData): AppData {
  if (stored?.defaultsRevision === DEFAULT_INDICES_REVISION) return stored;
  return addMissingDefaults(stored ?? structuredClone(emptyData));
}
