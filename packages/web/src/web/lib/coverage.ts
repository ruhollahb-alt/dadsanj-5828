import { parseDate, parseMonth, type IndexRow } from "./calculator";

export type CoverageInfo = {
  from: string;
  to: string;
  totalMonths: number;
  missing: string[];
};

function monthOrdinal(key: string): number {
  const [year, month] = key.split("/").map(Number);
  return year * 12 + month;
}

/**
 * Lists the calendar months between two Jalali dates that have no index row.
 * Invalid or reversed dates return null so the UI can stay quiet until both
 * dates are usable.
 */
export function coverageBetween(rows: IndexRow[], fromInput: string, toInput: string): CoverageInfo | null {
  let from: string;
  let to: string;
  try {
    from = parseDate(fromInput);
    to = parseDate(toInput);
  } catch {
    return null;
  }
  if (to < from) return null;

  const available = new Set<string>();
  for (const row of rows) {
    try {
      available.add(parseMonth(row.month));
    } catch {
      // Ignore rows the user is still typing.
    }
  }

  const fromMonth = from.slice(0, 7);
  const toMonth = to.slice(0, 7);
  const start = monthOrdinal(fromMonth);
  const end = monthOrdinal(toMonth);
  const missing: string[] = [];
  for (let ordinal = start; ordinal <= end; ordinal += 1) {
    const year = Math.floor((ordinal - 1) / 12);
    const month = ordinal - year * 12;
    const key = `${year}/${String(month).padStart(2, "0")}`;
    if (!available.has(key)) missing.push(key);
  }

  return {
    from: fromMonth,
    to: toMonth,
    totalMonths: end - start + 1,
    missing,
  };
}
