import { emptyData, parseMonth, type AppData, type IndexRow, type Payment } from "./calculator";

const esc = (s: string) => String(s ?? "").replace(/[\r\n]/g, " ").trim();
export function toIni(d: AppData): string {
  const lines = ["; Iran Delay Damages - local data (IRR / Jalali calendar)", "[meta]", "version=1", "currency=IRR", "calendar=jalali", "", "[indices]"];
  for (const row of [...d.indices].sort((a,b) => a.month.localeCompare(b.month))) lines.push(`${esc(row.month)}=${esc(row.value)}`);
  lines.push("", "[standard]", `principal=${esc(d.standard.principal)}`, `start=${esc(d.standard.start)}`, `end=${esc(d.standard.end)}`,
    "", "[partial]", `principal=${esc(d.partial.principal)}`, `start=${esc(d.partial.start)}`, `end=${esc(d.partial.end)}`);
  d.partial.payments.forEach((p, i) => lines.push("", `[payment.${i+1}]`, `date=${esc(p.date)}`, `amount=${esc(p.amount)}`));
  lines.push("", "[installment]", `principal=${esc(d.installment.principal)}`, `start=${esc(d.installment.start)}`, `ruling=${esc(d.installment.ruling)}`,
    `initial=${esc(d.installment.initial)}`, `mode=${d.installment.mode}`, `value=${esc(d.installment.value)}`, "");
  return lines.join("\n");
}
export function fromIni(text: string): AppData {
  const sections: Record<string, Record<string, string>> = {};
  let section = "";
  for (const raw of text.replace(/^﻿/, "").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || /^[;#]/.test(line)) continue;
    const match = /^\[([^\]]+)\]$/.exec(line);
    if (match) { section = match[1].toLowerCase(); sections[section] ??= {}; continue; }
    const pos = line.indexOf("=");
    if (pos < 0 || !section) throw Error(`ساختار فایل INI نامعتبر است: ${line.slice(0,40)}`);
    const key = line.slice(0,pos).trim();
    if (!key) throw Error("کلید خالی در فایل INI یافت شد.");
    if (Object.hasOwn(sections[section], key)) throw Error(`کلید تکراری در بخش ${section}: ${key}`);
    sections[section][key] = line.slice(pos+1).trim();
  }
  if (!sections.indices) throw Error("فایل باید بخش [indices] داشته باشد.");
  if (sections.meta?.currency && sections.meta.currency.toUpperCase() !== "IRR") throw Error("واحد پول فایل باید IRR باشد.");
  if (sections.meta?.calendar && sections.meta.calendar.toLowerCase() !== "jalali") throw Error("تقویم فایل باید jalali باشد.");
  const rows: IndexRow[] = Object.entries(sections.indices).map(([month,value]) => ({ month: parseMonth(month), value }));
  const seen = new Set<string>();
  for (const row of rows) {
    if (seen.has(row.month)) throw Error(`ماه تکراری در فایل: ${row.month}`);
    seen.add(row.month);
    if (!/^\d+(\.\d+)?$/.test(row.value) || Number(row.value) <= 0 || !Number.isFinite(Number(row.value))) throw Error(`شاخص نامعتبر برای ماه ${row.month}`);
  }
  const standard = sections.standard ?? {};
  const partial = sections.partial ?? {};
  const installment = sections.installment ?? {};
  const payments: Payment[] = Object.keys(sections).filter(k => /^payment\.\d+$/.test(k)).sort((a,b) => Number(a.split(".")[1])-Number(b.split(".")[1]))
    .map((key, i) => ({ id: `import-${i}-${Date.now()}`, date: sections[key].date ?? "", amount: sections[key].amount ?? "" }));
  return { indices: rows, standard: { ...emptyData.standard, ...standard },
    partial: { ...emptyData.partial, ...partial, payments },
    installment: { ...emptyData.installment, ...installment, mode: installment.mode === "amount" ? "amount" : "count" } };
}