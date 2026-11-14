import type { AppData, Result } from "./calculator";

/**
 * Short deterministic id for a calculation: same inputs, indices and result
 * produce the same id, so a printed or exported report can be matched back to
 * the case data that created it.
 */
export function reportFingerprint(data: AppData, result: Result, tab: string): string {
  const indices = [...data.indices]
    .map((row) => `${row.month}=${row.value}`)
    .sort()
    .join(";");
  const payload = JSON.stringify({
    tab,
    indices,
    standard: data.standard,
    partial: { ...data.partial, payments: data.partial.payments.map(({ date, amount }) => ({ date, amount })) },
    installment: data.installment,
    result: {
      principal: result.principal,
      damages: result.damages,
      total: result.total,
      startIndex: result.startIndex,
      endIndex: result.endIndex,
      paid: result.paid ?? 0,
    },
  });
  return `${fnv(payload, 0x811c9dc5)}${fnv(payload, 0x01000193)}`.slice(0, 12).toUpperCase();
}

function fnv(input: string, seed: number): string {
  let hash = seed;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}
