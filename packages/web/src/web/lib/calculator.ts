import { isValidJalaaliDate } from "jalaali-js";

export type Payment = { id: string; date: string; amount: string };
export type IndexRow = { month: string; value: string };
export type AppData = {
  indices: IndexRow[];
  standard: { principal: string; start: string; end: string };
  partial: { principal: string; start: string; end: string; payments: Payment[] };
  installment: { principal: string; start: string; ruling: string; initial: string; mode: "count" | "amount"; value: string };
};
export type Stage = { label: string; date: string; index: number; before: number; payment: number; after: number };
export type PlanRow = { number: number; principal: number; damages: number; total: number };
export type Result = { principal: number; damages: number; total: number; startIndex: number; endIndex: number; stages: Stage[]; plan?: PlanRow[]; paid?: number };

export const emptyData: AppData = {
  indices: [],
  standard: { principal: "", start: "", end: "" },
  partial: { principal: "", start: "", end: "", payments: [] },
  installment: { principal: "", start: "", ruling: "", initial: "", mode: "count", value: "" },
};

export const digits = (v: string) => v.replace(/[۰-۹]/g, c => String("۰۱۲۳۴۵۶۷۸۹".indexOf(c))).replace(/[٠-٩]/g, c => String("٠١٢٣٤٥٦٧٨٩".indexOf(c))).replace(/[,٬،\s]/g, "");
export const money = (n: number) => new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 0 }).format(Math.round(n));
export const indexText = (n: number) => new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 4 }).format(n);

export function parseDate(input: string): string {
  const value = digits(input).replace(/[-.]/g, "/");
  const m = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(value);
  if (!m) throw Error("تاریخ را به صورت ۱۴۰۳/۰۱/۰۱ وارد کنید.");
  const y = +m[1], month = +m[2], day = +m[3];
  if (y < 1200 || y > 1600 || !isValidJalaaliDate(y, month, day)) throw Error("تاریخ جلالی معتبر نیست.");
  return `${y}/${String(month).padStart(2,"0")}/${String(day).padStart(2,"0")}`;
}
export function parseMonth(input: string): string {
  const value = digits(input).replace(/[-.]/g, "/");
  const m = /^(\d{4})\/(\d{1,2})$/.exec(value);
  if (!m || +m[1] < 1200 || +m[1] > 1600 || +m[2] < 1 || +m[2] > 12) throw Error("ماه شاخص را به صورت ۱۴۰۳/۰۱ وارد کنید.");
  return `${m[1]}/${m[2].padStart(2,"0")}`;
}
function positive(s: string, name: string, allowZero = false): number {
  const raw = digits(s);
  const n = Number(raw);
  if (!/^\d+(\.\d+)?$/.test(raw) || !Number.isFinite(n) || n > 9e12 || (allowZero ? n < 0 : n <= 0)) throw Error(`${name} باید عددی ${allowZero ? "نامنفی" : "مثبت"} و معتبر باشد.`);
  return n;
}
function amount(s: string, name: string, allowZero = false): number {
  const n = positive(s, name, allowZero);
  if (!Number.isSafeInteger(n)) throw Error(`${name} باید به ریالِ کامل وارد شود.`);
  return n;
}
function getIndex(rows: IndexRow[], date: string): number {
  const key = date.slice(0, 7);
  const candidates = rows.filter(row => { try { return parseMonth(row.month) === key; } catch { return false; } });
  if (!candidates.length) throw Error(`شاخص ماه ${key} موجود نیست؛ آن را در صفحهٔ شاخص‌ها ثبت کنید.`);
  if (candidates.length > 1) throw Error(`شاخص ماه ${key} تکراری است؛ ردیف‌های تکراری را حذف کنید.`);
  return positive(candidates[0].value, `شاخص ماه ${key}`);
}
function dates(startInput: string, endInput: string) {
  const start = parseDate(startInput), end = parseDate(endInput);
  if (end < start) throw Error("تاریخ پایان نمی‌تواند پیش از تاریخ شروع باشد.");
  return { start, end };
}
export function calculateStandard(d: AppData): Result {
  const principal = amount(d.standard.principal, "مبلغ اصل دین");
  const { start, end } = dates(d.standard.start, d.standard.end);
  const startIndex = getIndex(d.indices, start), endIndex = getIndex(d.indices, end);
  const updated = principal * endIndex / startIndex;
  const damages = Math.max(0, Math.round(updated - principal));
  return { principal, damages, total: principal + damages, startIndex, endIndex, stages: [
    { label: "شروع محاسبه", date: start, index: startIndex, before: principal, payment: 0, after: principal },
    { label: "تسویه در تاریخ پایان", date: end, index: endIndex, before: updated, payment: 0, after: principal + damages },
  ] };
}
export function calculatePartial(d: AppData): Result {
  const principal = amount(d.partial.principal, "مبلغ اصل دین");
  const { start, end } = dates(d.partial.start, d.partial.end);
  const startIndex = getIndex(d.indices, start), endIndex = getIndex(d.indices, end);
  let prevIndex = startIndex, balance = principal, paid = 0;
  const stages: Stage[] = [{ label: "مانده در تاریخ شروع", date: start, index: startIndex, before: principal, payment: 0, after: principal }];
  const payments = d.partial.payments.map((p, i) => {
    const date = parseDate(p.date), sum = amount(p.amount, `پرداخت ${i+1}`);
    if (date < start || date > end) throw Error(`تاریخ پرداخت ${i+1} باید در بازهٔ محاسبه باشد.`);
    if (sum >= principal) throw Error(`پرداخت ${i+1} باید کمتر از مبلغ اصل دین باشد.`);
    return { date, sum, order: i };
  }).sort((a, b) => a.date.localeCompare(b.date) || a.order - b.order);
  for (const [i, p] of payments.entries()) {
    const index = getIndex(d.indices, p.date);
    const before = balance * index / prevIndex;
    if (p.sum > before + 1e-8) throw Error(`پرداخت ${i+1} از ماندهٔ محاسبه‌شده در آن مرحله بیشتر است.`);
    balance = before - p.sum;
    stages.push({ label: `پرداخت ${i+1}`, date: p.date, index, before, payment: p.sum, after: balance });
    paid += p.sum;
    prevIndex = index;
  }
  const finalBalance = balance * endIndex / prevIndex;
  stages.push({ label: "مانده در پایان", date: end, index: endIndex, before: finalBalance, payment: 0, after: finalBalance });
  const total = Math.round(finalBalance);
  return { principal, damages: Math.max(0, Math.round(paid + finalBalance - principal)), total, paid, startIndex, endIndex, stages };
}
export function calculateInstallment(d: AppData): Result {
  const v = d.installment;
  const principal = amount(v.principal, "مبلغ محکوم‌به");
  const { start, end } = dates(v.start, v.ruling);
  const initial = amount(v.initial || "0", "پیش‌پرداخت", true);
  if (initial > principal) throw Error("پیش‌پرداخت نمی‌تواند بیش از اصل محکوم‌به باشد.");
  const startIndex = getIndex(d.indices, start), endIndex = getIndex(d.indices, end);
  const damages = Math.max(0, Math.round(principal * (endIndex / startIndex - 1)));
  const remaining = principal - initial;
  let count: number;
  let fixed = 0;
  if (v.mode === "count") {
    count = amount(v.value, "تعداد اقساط");
    if (count > 600) throw Error("حداکثر تعداد اقساط ۶۰۰ است.");
  } else {
    fixed = amount(v.value, "مبلغ ثابت هر قسط");
    count = Math.max(1, Math.ceil(remaining / fixed));
    if (count > 600) throw Error("تعداد اقساط از ۶۰۰ بیشتر می‌شود؛ مبلغ هر قسط را افزایش دهید.");
  }
  if (!remaining && !damages) count = 0;
  const plan: PlanRow[] = [];
  let allocatedPrincipal = 0, allocatedDamage = 0;
  if (initial) plan.push({ number: 0, principal: initial, damages: 0, total: initial });
  for (let i = 1; i <= count; i++) {
    const part = remaining === 0 ? 0 : v.mode === "count" ? Math.floor(remaining / count) + (i <= remaining % count ? 1 : 0) : Math.min(fixed, remaining - allocatedPrincipal);
    const damagePart = Math.floor(damages / count) + (i <= damages % count ? 1 : 0);
    allocatedPrincipal += part;
    allocatedDamage += damagePart;
    plan.push({ number: i, principal: part, damages: damagePart, total: part + damagePart });
  }
  return { principal, damages, total: principal + damages, paid: initial, startIndex, endIndex,
    stages: [
      { label: "شروع دورهٔ خسارت", date: start, index: startIndex, before: principal, payment: 0, after: principal },
      { label: "صدور حکم اعسار / پایان دوره", date: end, index: endIndex, before: principal + damages, payment: initial, after: principal + damages - initial },
    ], plan };
}