import { isValidJalaaliDate } from "jalaali-js";
import {
  calculateDamages,
  calculateInsolvencyPlan,
  getIndex as publishedIndex,
  hasIndex as publishedHasIndex,
  installmentLateDamages,
  type IndexSource,
  type JalaliMonth,
} from "./cpi";

export type Payment = { id: string; date: string; amount: string };
export type IndexRow = { month: string; value: string };
export type AppData = {
  defaultsRevision?: string;
  indices: IndexRow[];
  standard: { principal: string; start: string; end: string };
  partial: { principal: string; start: string; end: string; payments: Payment[] };
  installment: { principal: string; start: string; ruling: string; initial: string; mode: "count" | "amount"; value: string };
};
export type Stage = { label: string; date: string; index: number; before: number; payment: number; after: number };
export type PlanRow = { number: number; principal: number; damages: number; total: number };
export type YearlyRow = { from: string; to: string; indexFrom: number; indexTo: number; ratio: number; total: number; damages: number };
export type Result = { principal: number; damages: number; total: number; startIndex: number; endIndex: number; stages: Stage[]; plan?: PlanRow[]; paid?: number; segments?: YearlyRow[] };

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
function dates(startInput: string, endInput: string) {
  const start = parseDate(startInput), end = parseDate(endInput);
  if (end < start) throw Error("تاریخ پایان نمی‌تواند پیش از تاریخ شروع باشد.");
  return { start, end };
}
/** The CBI index is monthly: a date maps to its Jalali year/month. */
function monthOf(date: string): JalaliMonth {
  const [year, month] = date.split("/").map(Number);
  return { year, month };
}

/** YYYY/MM label for an engine month. */
export function monthKey({ year, month }: JalaliMonth): string {
  return `${year}/${String(month).padStart(2, "0")}`;
}

/**
 * Builds the calculation's index view from the rows the user sees (defaults
 * plus manual corrections). Published CBI levels fill any month not listed,
 * so calculations no longer mutate shared module state.
 */
function indexSource(rows: IndexRow[]): IndexSource {
  const levels = new Map<string, number>();
  for (const row of rows) {
    let key: string;
    try { key = parseMonth(row.month); } catch { continue; }
    const value = Number(digits(row.value));
    if (!Number.isFinite(value) || value <= 0) continue;
    levels.set(key, value);
  }
  return {
    hasIndex: (month) => levels.has(monthKey(month)) || publishedHasIndex(month),
    getIndex: (month) => {
      const value = levels.get(monthKey(month));
      return value === undefined ? publishedIndex(month) : { level: value, inflation: null };
    },
  };
}

export function calculateStandard(d: AppData): Result {
  const principal = amount(d.standard.principal, "مبلغ اصل دین");
  const { start, end } = dates(d.standard.start, d.standard.end);
  const indices = indexSource(d.indices);
  const r = calculateDamages({ debt: principal, from: monthOf(start), to: monthOf(end), indices });
  const damages = Math.max(0, Math.round(r.damages));
  return {
    principal,
    damages,
    total: Math.round(r.total),
    startIndex: r.indexFrom,
    endIndex: r.indexTo,
    stages: [
      { label: "شروع محاسبه", date: start, index: r.indexFrom, before: principal, payment: 0, after: principal },
      { label: "تسویه در تاریخ پایان", date: end, index: r.indexTo, before: Math.round(r.total), payment: 0, after: Math.round(r.total) },
    ],
    segments: r.segments.map((s) => ({
      from: monthKey(s.from),
      to: monthKey(s.to),
      indexFrom: s.indexFrom,
      indexTo: s.indexTo,
      ratio: s.ratio,
      total: s.updatedTotal,
      damages: s.damages,
    })),
  };
}

export function calculatePartial(d: AppData): Result {
  const principal = amount(d.partial.principal, "مبلغ اصل دین");
  const { start, end } = dates(d.partial.start, d.partial.end);
  const startMonth = monthOf(start), endMonth = monthOf(end);
  const startOrdinal = startMonth.year * 12 + startMonth.month;
  const endOrdinal = endMonth.year * 12 + endMonth.month;

  const payments = d.partial.payments.map((p, i) => {
    const date = parseDate(p.date), sum = amount(p.amount, `پرداخت ${i+1}`);
    const month = monthOf(date);
    const ordinal = month.year * 12 + month.month;
    if (ordinal < startOrdinal || ordinal > endOrdinal) throw Error(`تاریخ پرداخت ${i+1} باید در بازهٔ محاسبه باشد.`);
    if (sum >= principal) throw Error(`پرداخت ${i+1} باید کمتر از مبلغ اصل دین باشد.`);
    return { id: p.id, date, sum, month };
  }).sort((a, b) => a.date.localeCompare(b.date));

  const indices = indexSource(d.indices);
  const r = calculateDamages({
    debt: principal,
    from: startMonth,
    to: endMonth,
    payments: payments.map(p => ({ id: p.id, month: p.month, amount: p.sum })),
    indices,
  });

  const dateByOrdinal = new Map(payments.map(p => [p.month.year * 12 + p.month.month, p.date]));
  const stages: Stage[] = [
    { label: "مانده در تاریخ شروع", date: start, index: r.indexFrom, before: principal, payment: 0, after: principal },
  ];
  r.paymentStages.forEach((s, i) => {
    stages.push({
      label: `پرداخت ${i + 1}`,
      date: dateByOrdinal.get(s.month.year * 12 + s.month.month) ?? start,
      index: s.indexPay,
      before: s.balanceBefore,
      payment: s.paid,
      after: s.balanceAfter,
    });
  });
  stages.push({ label: "مانده در پایان", date: end, index: r.indexTo, before: Math.round(r.total), payment: 0, after: Math.round(r.total) });

  return {
    principal,
    damages: Math.max(0, Math.round(r.damages)),
    total: Math.round(r.total),
    startIndex: r.indexFrom,
    endIndex: r.indexTo,
    stages,
    paid: r.totalPaid,
    segments: r.segments.map((s) => ({
      from: monthKey(s.from),
      to: monthKey(s.to),
      indexFrom: s.indexFrom,
      indexTo: s.indexTo,
      ratio: s.ratio,
      total: s.updatedTotal,
      damages: s.damages,
    })),
  };
}

export function calculateInstallment(d: AppData): Result {
  const v = d.installment;
  const principal = amount(v.principal, "مبلغ محکوم‌به");
  const { start, end } = dates(v.start, v.ruling);
  const initial = amount(v.initial || "0", "پیش‌پرداخت", true);
  if (initial > principal) throw Error("پیش‌پرداخت نمی‌تواند بیش از اصل محکوم‌به باشد.");

  const indices = indexSource(d.indices);
  const plan = calculateInsolvencyPlan({
    debt: principal,
    start: monthOf(start),
    ruling: monthOf(end),
    cashPayment: initial,
    cashPaymentDateType: "ruling",
    mode: v.mode,
    installmentAmount: v.mode === "amount" ? amount(v.value, "مبلغ ثابت هر قسط") : 0,
    installmentCount: v.mode === "count" ? amount(v.value, "تعداد اقساط") : 0,
    indices,
  });

  // Split every installment into its principal/damages share (as the report shows).
  const rows: PlanRow[] = [];
  if (plan.cashPayment > 0) rows.push({ number: 0, principal: plan.cashPayment, damages: 0, total: plan.cashPayment });
  let remainingPrincipal = Math.round(principal - plan.cashPayment);
  let remainingDamages = Math.round(plan.damages);
  plan.installments.forEach((inst, i) => {
    const last = i === plan.installments.length - 1;
    const principalShare = last ? remainingPrincipal : Math.min(remainingPrincipal, Math.round((inst.amount * (principal - plan.cashPayment)) / plan.remainder));
    const damagesShare = last ? remainingDamages : inst.amount - principalShare;
    remainingPrincipal -= principalShare;
    remainingDamages -= damagesShare;
    rows.push({ number: inst.n, principal: principalShare, damages: damagesShare, total: inst.amount });
  });

  const damages = Math.max(0, Math.round(plan.damages));
  return {
    principal,
    damages,
    total: Math.round(plan.total),
    startIndex: plan.indexStart,
    endIndex: plan.indexRuling,
    stages: [
      { label: "شروع دورهٔ خسارت", date: start, index: plan.indexStart, before: principal, payment: 0, after: principal },
      { label: "صدور حکم اعسار / پایان دوره", date: end, index: plan.indexRuling, before: Math.round(plan.total), payment: plan.cashPayment, after: Math.round(plan.total) - plan.cashPayment },
    ],
    plan: rows,
    paid: plan.cashPayment,
  };
}

/** Delayed-payment damages for one installment paid after its due month. */
export function calculateLateInstallment(
  d: AppData,
  input: { amount: string; due: string; paid: string },
): number {
  const value = amount(input.amount, "مبلغ قسط");
  const due = monthOf(parseDate(input.due));
  const paid = monthOf(parseDate(input.paid));
  const damages = installmentLateDamages({
    amount: value,
    due,
    paid,
    indices: indexSource(d.indices),
  });
  return Math.max(0, Math.round(damages));
}
