import { emptyData, parseMonth, type AppData, type IndexRow } from "./calculator";

// Transcribed and visually checked against the CBI table attached to letter
// 02/10899, 1402/01/22, reproduced by Ekhtebar. One series: 1395 = 100.
export const DEFAULT_INDICES_REVISION = "cbi-1395-1390-1401-v1";
export const INDEX_SOURCE_URL = "https://www.ekhtebar.ir/اعداد-شاخص-سالانه-و-ماهانه-جهت-محاسبه-3/";
export const INDEX_TABLE_URL = "https://www.ekhtebar.ir/wp-content/uploads/2023/04/shakhes-2.jpg";
const years: Record<string, string> = {
  1390: "37.5 38.1 38.6 38.7 39.1 39.8 40.2 40.8 41.4 42 43.1 44.5",
  1391: "45.5 46.6 47.1 48.1 48.9 50.3 52.7 55.2 56.4 57.5 60.5 62.9",
  1392: "64.7 66 68.3 69.2 70 71.2 72.1 72.8 73.1 74 74.3 75.2",
  1393: "76 76.9 78.2 79.3 80.4 81.4 82.6 83.8 85.4 85.6 86.3 87.4",
  1394: "88.5 89.4 90.9 90.6 90.5 91 91.5 92.2 93.4 93.8 94 94.7",
  1395: "95 96.3 97.7 98.3 99.2 99.6 100 100.2 101.7 102.5 103.7 105.9",
  1396: "107.1 107.1 107.8 107.5 107.7 108 108.4 109.8 111.9 112.4 113.4 114.7",
  1397: "115.6 117.5 122.6 126.8 133.8 141.9 148.4 153.6 159.3 162.1 167.7 176.8",
  1398: "182.7 188.2 192.6 196.9 198.5 200.1 201.4 204.1 212.5 214.7 219.6 226.5",
  1399: "229.9 240.2 249.8 261.8 270.8 281.3 302.8 326.1 338.9 347.5 363 374.2",
  1400: "378.3 382 399.3 410 421.7 435.6 448.9 459.7 468.2 474.2 482 484.6",
  1401: "495.1 520.4 575.4 600.4 614.8 631 649.5 663.5 679.8 713.4 745.1 794.3",
};
export const defaultIndices: IndexRow[] = Object.entries(years).flatMap(([year, values]) =>
  values.split(" ").map((value, i) => ({ month: `${year}/${String(i + 1).padStart(2, "0")}`, value })));
const reference = new Map(defaultIndices.map(row => [row.month, Number(row.value)]));
export function matchesReference(row: IndexRow): boolean {
  try { return reference.get(parseMonth(row.month)) === Number(row.value); } catch { return false; }
}
// Missing-only merge: never replace the user's value, forms or payments.
export function addMissingDefaults(data: AppData): AppData {
  const existing = new Set(data.indices.map(row => { try { return parseMonth(row.month); } catch { return row.month; } }));
  return { ...data, defaultsRevision: DEFAULT_INDICES_REVISION,
    indices: [...data.indices, ...defaultIndices.filter(row => !existing.has(row.month)).map(row => ({ ...row }))] };
}
export function initializeData(stored?: AppData): AppData {
  if (stored?.defaultsRevision === DEFAULT_INDICES_REVISION) return stored;
  return addMissingDefaults(stored ?? structuredClone(emptyData));
}