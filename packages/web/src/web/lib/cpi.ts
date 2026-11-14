/***
 * شاخص بهای کالاها و خدمات مصرفی — بانک مرکزی جمهوری اسلامی ایران
 * CPI used for خسارت تأخیر تأدیه per Article 522 of the Civil Procedure Code.
 *
 * The published table has two figures per month:
 *  - level: index level relative to Farvardin 1395 = 100 (used by رأی وحدت رویه ۸۵۰)
 *  - inflation: year-on-year change vs the same month of the previous year (%)
 *
 * Values follow the Central Bank of Iran table (1375 → 1405), as published by
 * CBI and mirrored by legal reference sites.
 */

export const MONTH_NAMES = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
] as const;

/** level = index level (base 100 = 1395), inflation = year-on-year % */
export interface MonthEntry {
  level: number;
  inflation: number | null;
}

interface RawRow {
  year: number;
  levels: (number | null)[]; // 12 entries, null => not yet published
  inflation: (number | null)[]; // 12 entries
}

const RAW: RawRow[] = [
  { year: 1375, levels: [4.344, 4.344, 4.344, 4.344, 4.344, 4.424, 4.464, 4.545, 4.625, 4.706, 4.746, 4.826], inflation: Array(12).fill(null) },
  { year: 1376, levels: [4.987, 5.108, 5.108, 5.108, 5.188, 5.229, 5.229, 5.269, 5.349, 5.47, 5.631, 5.711], inflation: Array(12).fill(null) },
  { year: 1377, levels: [5.953, 5.953, 5.953, 6.033, 6.033, 6.113, 6.194, 6.274, 6.435, 6.516, 6.636, 6.797], inflation: Array(12).fill(null) },
  { year: 1378, levels: [7.199, 7.24, 7.28, 7.24, 7.28, 7.36, 7.441, 7.481, 7.682, 7.803, 7.923, 8.044], inflation: Array(12).fill(null) },
  { year: 1379, levels: [8.124, 8.124, 8.245, 8.165, 8.285, 8.326, 8.406, 8.486, 8.647, 8.688, 8.768, 8.929], inflation: Array(12).fill(null) },
  { year: 1380, levels: [9.09, 9.09, 9.13, 9.17, 9.251, 9.291, 9.331, 9.371, 9.572, 9.693, 9.814, 9.975], inflation: Array(12).fill(null) },
  { year: 1381, levels: [10.176, 10.417, 10.578, 10.578, 10.618, 10.779, 10.779, 10.94, 11.141, 11.382, 11.583, 11.744], inflation: Array(12).fill(null) },
  { year: 1382, levels: [11.986, 12.106, 12.267, 12.348, 12.388, 12.388, 12.468, 12.629, 12.911, 13.072, 13.152, 13.353], inflation: Array(12).fill(null) },
  { year: 1383, levels: [13.72, 13.88, 14.08, 14.24, 14.32, 14.36, 14.52, 14.64, 14.8, 15, 15.16, 15.44], inflation: Array(12).fill(null) },
  { year: 1384, levels: [15.97, 15.85, 15.81, 15.69, 15.69, 15.73, 15.85, 16.01, 16.17, 16.29, 16.45, 16.69], inflation: Array(12).fill(null) },
  { year: 1385, levels: [16.81, 16.97, 17.25, 17.25, 17.33, 17.66, 17.9, 18.06, 18.5, 18.86, 19.1, 19.31], inflation: Array(12).fill(null) },
  { year: 1386, levels: [19.63, 19.79, 20.03, 20.19, 20.31, 20.83, 21.16, 21.52, 22.12, 22.48, 22.97, 23.65], inflation: Array(12).fill(null) },
  { year: 1387, levels: [24.37, 24.78, 25.34, 25.46, 25.94, 26.95, 27.39, 27.59, 27.95, 27.83, 27.71, 27.83], inflation: Array(12).fill(null) },
  { year: 1388, levels: [28.15, 28.52, 29, 29.04, 29.32, 29.44, 29.48, 29.64, 30, 30, 30.21, 30.77], inflation: Array(12).fill(null) },
  { year: 1389, levels: [31.05, 31.17, 31.41, 31.73, 32.14, 32.38, 32.98, 33.34, 33.87, 34.75, 35.63, 36.84], inflation: Array(12).fill(null) },
  { year: 1390, levels: [37.5, 38.1, 38.6, 38.7, 39.1, 39.8, 40.2, 40.8, 41.4, 42, 43.1, 44.5], inflation: Array(12).fill(null) },
  { year: 1391, levels: [45.5, 46.6, 47.1, 48.1, 48.9, 50.3, 52.7, 55.2, 56.4, 57.5, 60.5, 62.9], inflation: Array(12).fill(null) },
  { year: 1392, levels: [64.7, 66, 68.3, 69.2, 70, 71.2, 72.1, 72.8, 73.1, 74, 74.3, 75.2], inflation: Array(12).fill(null) },
  { year: 1393, levels: [76, 76.9, 78.2, 79.3, 80.4, 81.4, 82.6, 83.8, 85.4, 85.6, 86.3, 87.4], inflation: Array(12).fill(null) },
  { year: 1394, levels: [88.5, 89.4, 90.9, 90.6, 90.5, 91, 91.5, 92.2, 93.4, 93.8, 94, 94.7], inflation: Array(12).fill(null) },
  { year: 1395, levels: [95, 96.3, 97.7, 98.3, 99.2, 99.6, 100, 100.2, 101.7, 102.5, 103.7, 105.9], inflation: Array(12).fill(null) },
  { year: 1396, levels: [107.1, 107.1, 107.8, 107.5, 107.7, 108, 108.4, 109.8, 111.9, 112.4, 113.4, 114.7], inflation: [12.74, 11.22, 10.34, 9.36, 8.57, 8.43, 8.4, 9.58, 10.03, 9.66, 9.35, 8.31] },
  { year: 1397, levels: [115.6, 117.5, 122.6, 126.8, 133.8, 141.9, 148.4, 153.6, 159.3, 162.1, 167.7, 176.8], inflation: [7.94, 9.71, 13.73, 17.95, 24.23, 31.39, 36.9, 39.89, 42.36, 44.2, 47.88, 54.06] },
  { year: 1398, levels: [182.7, 188.2, 192.6, 196.9, 198.5, 200.1, 201.4, 204.1, 212.5, 214.7, 219.6, 226.5], inflation: [58.04, 60.17, 57.1, 55.28, 48.36, 41.01, 35.71, 32.88, 33.4, 32.45, 30.95, 28.11] },
  { year: 1399, levels: [229.9, 240.2, 249.8, 261.8, 270.8, 281.3, 302.8, 326.1, 338.9, 347.5, 363, 374.2], inflation: [25.84, 27.63, 29.7, 32.96, 36.42, 40.58, 50.35, 59.78, 59.48, 61.85, 65.3, 65.21] },
  { year: 1400, levels: [378.3, 382, 399.3, 410, 421.7, 435.6, 448.9, 459.7, 468.2, 474.2, 482, 484.6], inflation: [64.59, 59.03, 59.85, 56.61, 55.72, 54.85, 48.25, 40.97, 38.15, 36.46, 32.78, 29.5] },
  { year: 1401, levels: [495.1, 520.4, 575.4, 600.4, 614.8, 631, 649.5, 663.5, 679.8, 713.4, 745.1, 794.3], inflation: [30.87, 36.23, 44.1, 46.44, 45.84, 44.86, 44.69, 44.36, 45.19, 50.44, 54.59, 63.91] },
  { year: 1402, levels: [834.9, 858.3, 885.8, 908.8, 940.6, 971.6, 995.9, 1014.8, 1048.3, 1066.1, 1076.8, 1097.3], inflation: [68.64, 64.93, 53.98, 51.37, 52.99, 53.95, 53.33, 52.94, 54.2, 49.44, 44.52, 38.12] },
  { year: 1403, levels: [1125.8, 1159.6, 1206, 1242.2, 1277, 1306.4, 1339.1, 1379.3, 1402.7, 1433.6, 1485.2, 1531.2], inflation: [34.84, 35.13, 36.15, 36.69, 35.75, 34.46, 34.46, 35.93, 33.77, 34.47, 37.93, 39.54] },
  { year: 1404, levels: [1589.5, 1625.7, 1689.2, 1742.7, 1802.6, 1877.9, 1967.6, 2033.7, 2100.9, 2220.7, 2408.4, 2481.3], inflation: [41.17, 40.18, 40.07, 40.32, 41.16, 43.75, 46.94, 47.44, 49.79, 54.91, 62.16, 62.13] },
  { year: 1405, levels: [2654.9, 2880.4, 3092.3, 3205.1, 3323.9, 3452.1, 3611.1, null, null, null, null, null], inflation: [67.05, 77.23, 83.11, 83.9, 84.36, 83.8, null, null, null, null, null, null] },
];

export const FIRST_YEAR = RAW[0].year; // 1375
export const LAST_YEAR = RAW[RAW.length - 1].year; // 1405

export const YEARS: number[] = RAW.map((r) => r.year);

const BY_KEY = new Map<string, MonthEntry>();
for (const row of RAW) {
  row.levels.forEach((level, i) => {
    if (level !== null) {
      BY_KEY.set(`${row.year}-${i + 1}`, {
        level,
        inflation: row.inflation[i] ?? null,
      });
    }
  });
}

// --- Index source -----------------------------------------------------------
// Published levels are the fallback. The user's per-case rows (defaults plus
// manual corrections) are passed in as an IndexSource, so calculation stays a
// pure function of the case data and never reads or writes storage itself.
export interface IndexSource {
  hasIndex(month: JalaliMonth): boolean;
  getIndex(month: JalaliMonth): MonthEntry | undefined;
}

export interface JalaliMonth {
  year: number; // Jalali year, e.g. 1403
  month: number; // 1..12 (1 = فروردین)
}

export function monthLabel({ year, month }: JalaliMonth): string {
  return `${MONTH_NAMES[month - 1]} ${toPersianDigits(year)}`;
}

/** 1 = فروردین … 12 = اسفند; sequential months since 1375/01 */
export function monthOrdinal({ year, month }: JalaliMonth): number {
  return (year - FIRST_YEAR) * 12 + month;
}

export function monthFromOrdinal(ordinal: number): JalaliMonth {
  const y = FIRST_YEAR + Math.floor((ordinal - 1) / 12);
  const m = ((ordinal - 1) % 12) + 1;
  return { year: y, month: m };
}

export function hasIndex({ year, month }: JalaliMonth): boolean {
  return BY_KEY.has(`${year}-${month}`);
}

export function getIndex({ year, month }: JalaliMonth): MonthEntry | undefined {
  return BY_KEY.get(`${year}-${month}`);
}

/** The bundled CBI series, used when a caller has no case-specific source. */
export const publishedIndexSource: IndexSource = { hasIndex, getIndex };

/** Most recent month that has a published index level. */
export function latestMonth(): JalaliMonth {
  for (let y = LAST_YEAR; y >= FIRST_YEAR; y--) {
    for (let m = 12; m >= 1; m--) {
      if (hasIndex({ year: y, month: m })) return { year: y, month: m };
    }
  }
  return { year: FIRST_YEAR, month: 1 };
}

/***
 * ماه جاری بر اساس تقویم هجری شمسی (سیستم‌عامل/مرورگر).
 * برای تشخیص «از سررسید گذشته» به‌کار می‌رود؛ برخلاف شاخص که فقط تا ماه
 * منتشرشده در دسترس است. اگر موتور تقویم شمسی را پشتیبانی نکند، ماه
 * آخرین شاخص برگردانده می‌شود تا محاسبه از کار نیفتد.
 */
export function todayJalaliMonth(): JalaliMonth {
  try {
    const parts = new Intl.DateTimeFormat("en-u-ca-persian", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    }).formatToParts(new Date());
    const get = (type: string) =>
      Number(parts.find((p) => p.type === type)?.value ?? NaN);
    const year = get("year");
    const month = get("month");
    if (Number.isFinite(year) && month >= 1 && month <= 12) {
      return { year, month };
    }
  } catch {
    // موتور قدیمی — فالب پایین اعمال می‌شود
  }
  return latestMonth();
}

// ---------------------------------------------------------------------------
// Calculation engine — Article 522 + Unification Ruling No. 850 (1403/05/16)
// ---------------------------------------------------------------------------

export interface SegmentResult {
  /** from — inclusive */
  from: JalaliMonth;
  /** to — inclusive */
  to: JalaliMonth;
  indexFrom: number;
  indexTo: number;
  ratio: number; // indexTo / indexFrom
  /** debt × ratio, i.e. original + damages for this segment */
  updatedTotal: number;
  damages: number; // updatedTotal − debtAtSegmentStart
}

export interface PaymentInput {
  /** stable row id (UI only) */
  id: string;
  /** month the payment was made */
  month: JalaliMonth;
  /** payment amount, same currency unit as the debt */
  amount: number;
}

export interface CalculationInput {
  debt: number;
  from: JalaliMonth;
  to: JalaliMonth;
  /** optional partial payments made between `from` and `to` */
  payments?: PaymentInput[];
  /** case-specific monthly levels (published series + user corrections) */
  indices?: IndexSource;
}

export interface CalculationResult {
  debt: number;
  from: JalaliMonth;
  to: JalaliMonth;
  indexFrom: number;
  indexTo: number;
  months: number;
  ratio: number; // indexTo / indexFrom
  /**
   * No payments: debt × ratio (updated total).
   * With payments: remaining outstanding balance updated to month `to`.
   */
  total: number;
  /**
   * No payments: total − debt.
   * With payments: (total + totalPaid) − debt.
   */
  damages: number;
  segments: SegmentResult[];
  /** per-payment stages, in chronological order (empty when no payments) */
  paymentStages: PaymentStageResult[];
  /** sum of all accepted partial payments */
  totalPaid: number;
}

export interface PaymentStageResult {
  month: JalaliMonth;
  /** index of the previous stage (start month, or previous payment month) */
  indexPrev: number;
  /** index at the payment month */
  indexPay: number;
  ratio: number; // indexPay / indexPrev
  /** outstanding balance carried in from the previous stage */
  balanceBefore: number;
  /** balanceBefore × ratio */
  updatedBalance: number;
  /** total paid at this month */
  paid: number;
  /** updatedBalance − paid → carried to the next stage */
  balanceAfter: number;
  /** inflation growth for this stage: updatedBalance − balanceBefore */
  stageDamages: number;
}

/**
 * Computes damages by chaining the year-on-year index across the debt period.
 *
 * Because the CBI table is relative to the base year 1395, the ratio of the two
 * published levels equals the product of every intervening yearly change, so
 * the chain is exact and the result matches the ruling formula
 * (index at payment ÷ index at due date × debt).
 *
 * With partial payments, each payment stage first updates the outstanding
 * balance by the index ratio since the previous stage and then subtracts the
 * payment; the remaining balance is carried forward and finally updated to the
 * `to` month. Total damages = final balance + sum of payments − original debt.
 */
export function calculateDamages({
  debt,
  from,
  to,
  payments = [],
  indices = publishedIndexSource,
}: CalculationInput): CalculationResult {
  const a = indices.getIndex(from);
  const b = indices.getIndex(to);
  if (!a || !b) throw new Error("شاخص برای یکی از ماه‌های انتخابی منتشر نشده است");
  if (debt <= 0) throw new Error("مبلغ دین باید بزرگ‌تر از صفر باشد");

  const fromOrd = monthOrdinal(from);
  const toOrd = monthOrdinal(to);
  const months = toOrd - fromOrd;

  // Every intermediate month must have a published index for the chain to be exact.
  for (let o = fromOrd; o <= toOrd; o++) {
    if (!indices.hasIndex(monthFromOrdinal(o))) {
      throw new Error("شاخص برای یکی از ماه‌های میانی بازه منتشر نشده است");
    }
  }

  // Group payments by month (multiple payments in one month are summed),
  // then validate each one.
  const grouped = new Map<number, number>();
  for (const p of payments) {
    if (!(p.amount > 0)) {
      throw new Error("مبلغ پرداختی باید بزرگ‌تر از صفر باشد");
    }
    const ord = monthOrdinal(p.month);
    if (ord <= fromOrd) {
      throw new Error("تاریخ پرداخت باید پس از تاریخ سررسید باشد");
    }
    if (ord > toOrd) {
      throw new Error("تاریخ پرداخت نمی‌تواند بعد از تاریخ تأدیه باشد");
    }
    if (!indices.hasIndex(p.month)) {
      throw new Error("شاخص ماه یکی از پرداخت‌ها منتشر نشده است");
    }
    grouped.set(ord, (grouped.get(ord) ?? 0) + p.amount);
  }

  // Staged payments: at each payment month the outstanding balance is first
  // updated by the index ratio since the previous stage, then the payment is
  // subtracted:  balanceAfter = (I_pay ÷ I_prev) × balanceBefore − payment
  const paymentStages: PaymentStageResult[] = [];
  let currentIndex = a.level;
  let balance = debt;
  let totalPaid = 0;

  const sortedOrds = [...grouped.keys()].sort((x, y) => x - y);
  for (const ord of sortedOrds) {
    const month = monthFromOrdinal(ord);
    const indexPay = indices.getIndex(month)!.level;
    const ratio = indexPay / currentIndex;
    const balanceBefore = balance;
    const updatedBalance = balanceBefore * ratio;
    const paid = grouped.get(ord)!;
    if (paid >= updatedBalance) {
      throw new Error(
        `مبلغ پرداختی در ${monthLabel(month)} باید کمتر از مانده بدهی به‌روزشده در آن ماه باشد`,
      );
    }
    balance = updatedBalance - paid;
    totalPaid += paid;
    paymentStages.push({
      month,
      indexPrev: currentIndex,
      indexPay,
      ratio,
      balanceBefore,
      updatedBalance,
      paid,
      balanceAfter: balance,
      stageDamages: updatedBalance - balanceBefore,
    });
    currentIndex = indexPay;
  }

  // Final update from the last stage (or the start month) to `to`.
  const finalBalance = balance * (b.level / currentIndex);

  const ratio = b.level / a.level;
  const total = finalBalance;
  const damages = total + totalPaid - debt;

  // Yearly chain breakdown is only meaningful when the whole debt stays unpaid.
  const segments: SegmentResult[] = [];
  if (sortedOrds.length === 0) {
    let curOrd = fromOrd;
    let curIndex = a.level;
    let runningTotal = debt;

    while (curOrd < toOrd) {
      const step = Math.min(12, toOrd - curOrd);
      const nextOrd = curOrd + step;
      const fromM = monthFromOrdinal(curOrd);
      const toM = monthFromOrdinal(nextOrd);
      const nextIndex = indices.getIndex(toM)!.level;
      const stepRatio = nextIndex / curIndex;
      const updatedTotal = debt * (nextIndex / a.level);
      segments.push({
        from: fromM,
        to: toM,
        indexFrom: curIndex,
        indexTo: nextIndex,
        ratio: stepRatio,
        updatedTotal,
        damages: updatedTotal - runningTotal,
      });
      runningTotal = updatedTotal;
      curOrd = nextOrd;
      curIndex = nextIndex;
    }
  }

  return {
    debt,
    from,
    to,
    indexFrom: a.level,
    indexTo: b.level,
    months,
    ratio,
    total,
    damages,
    segments,
    paymentStages,
    totalPaid,
  };
}

// ---------------------------------------------------------------------------
// Insolvency installment plan (اعسار / تقسیط)
// ---------------------------------------------------------------------------

/** Upper bound on schedule length (installments are monthly, so 600 = 50 years). *
 * A very small per-installment amount (or a very large requested count) would
 * otherwise imply millions of rows: building that table allocates gigabytes and
 * freezes the page, so such inputs are rejected with a clear message instead.
 */
const MAX_INSTALLMENTS = 600;

export interface InsolvencyInstallment {
  /** 1-based installment number */
  n: number;
  /** due month (first installment = the month after the ruling) */
  month: JalaliMonth;
  amount: number;
  /** outstanding balance after this installment */
  balanceAfter: number;
}

export interface InsolvencyPlanInput {
  /** judgment amount (اصل محکوم‌به) */
  debt: number;
  /** month the damages start accruing (due month of the debt) */
  start: JalaliMonth;
  /** month the insolvency ruling (رأی اعسار) is issued */
  ruling: JalaliMonth;
  /** optional cash payment made at the ruling date, or 1-3 months after */
  cashPayment?: number;
  /** cash payment date type: "ruling" (at ruling date), "1month_after", "2months_after", or "3months_after" */
  cashPaymentDateType?: "ruling" | "1month_after" | "2months_after" | "3months_after";
  /** "amount" → fixed amount per installment; "count" → fixed number of installments */
  mode: "amount" | "count";
  /** fixed amount per installment (mode === "amount") */
  installmentAmount?: number;
  /** number of installments (mode === "count") */
  installmentCount?: number;
  /** case-specific monthly levels (published series + user corrections) */
  indices?: IndexSource;
}

export interface InsolvencyPlanResult {
  debt: number;
  start: JalaliMonth;
  ruling: JalaliMonth;
  indexStart: number;
  indexRuling: number;
  months: number;
  ratio: number; // indexRuling / indexStart
  damages: number; // debt × ratio − debt, from start to ruling
  /** debt + damages — the amount the court distributes over the plan */
  total: number;
  cashPayment: number;
  /** total − cashPayment, allocated across the installments */
  remainder: number;
  mode: "amount" | "count";
  installments: InsolvencyInstallment[];
}

/***
 * Insolvency (اعسار) scenario: the judgment amount stays unpaid from the
 * damages start month until the month the insolvency ruling is issued.
 * Damages accrue over that span exactly as in {@link calculateDamages}
 * (no interim payments):  debt × (I_ruling ÷ I_start).
 *
 * The resulting total (debt + damages) is then allocated across the plan:
 * an optional cash payment at the ruling date, or 1-3 months after the ruling,
 * and the remainder split into equal monthly installments — either by a fixed
 * amount per installment (the last one absorbs what is left) or by a fixed
 * number of installments.
 * Per the requested semantics, installments after the ruling are NOT
 * re-indexed; the whole exposure is fixed at the ruling date.
 * The cash payment date can be: "ruling" (at the ruling date),
 * "1month_after" (1 month after the ruling), "2months_after" (2 months
 * after the ruling), or "3months_after" (3 months after the ruling). When a
 * delay is selected, the installment plan starts from that date instead of
 * the month after the ruling.
 */
export function calculateInsolvencyPlan({
  debt,
  start,
  ruling,
  cashPayment = 0,
  cashPaymentDateType = "ruling" as const,
  mode,
  installmentAmount = 0,
  installmentCount = 0,
  indices = publishedIndexSource,
}: InsolvencyPlanInput): InsolvencyPlanResult {
  if (!(debt > 0)) throw new Error("مبلغ دین باید بزرگ‌تر از صفر باشد");

  const startOrd = monthOrdinal(start);
  const rulingOrd = monthOrdinal(ruling);
  if (rulingOrd <= startOrd) {
    throw new Error("تاریخ رأی اعسار باید posterior از تاریخ شروع خسارت باشد");
  }

  const a = indices.getIndex(start);
  const b = indices.getIndex(ruling);
  if (!a || !b) throw new Error("شاخص برای یکی از ماه‌های انتخابی منتشر نشده است");
  // Every intermediate month must be published for the ratio to be exact.
  for (let o = startOrd; o <= rulingOrd; o++) {
    if (!indices.hasIndex(monthFromOrdinal(o))) {
      throw new Error("شاخص برای یکی از ماه‌های میانی بازه منتشر نشده است");
    }
  }

  if (cashPayment < 0) {
    throw new Error("مبلغ پرداخت نقدی نمی‌تواند منفی باشد");
  }

  const ratio = b.level / a.level;
  // Calculate effective ruling month based on cash payment date type
  let effectiveRulingOrd: number
  switch (cashPaymentDateType) {
    case "1month_after":
      effectiveRulingOrd = rulingOrd + 1
      break
    case "2months_after":
      effectiveRulingOrd = rulingOrd + 2
      break
    case "3months_after":
      effectiveRulingOrd = rulingOrd + 3
      break
    default:
      effectiveRulingOrd = rulingOrd
  }

  const total = debt * ratio;
  const damages = total - debt;

  // The plan lives in whole rials so the schedule sums exactly.
  const totalR = Math.round(total);
  const cashR = Math.round(cashPayment);
  if (cashR >= totalR) {
    throw new Error("مبلغ پرداخت نقدی باید کمتر از collectiv کل باشد");
  }
  const remainderR = totalR - cashR;

  const installments: InsolvencyInstallment[] = [];
  let per: number;
  let count: number;

  if (mode === "amount") {
    if (!(installmentAmount > 0)) {
      throw new Error("مبلغ هر قسط باید بزرگ‌تر از صفر باشد");
    }
    // An entered amount larger than the remainder simply means one installment.
    per = Math.min(Math.round(installmentAmount), remainderR);
    if (!Number.isFinite(per) || per < 1) {
      throw new Error("مبلغ هر قسط باید بزرگ‌تر از صفر باشد");
    }
    count = Math.ceil(remainderR / per);
    if (count > MAX_INSTALLMENTS) {
      throw new Error(
        `مبلغ هر قسط خیلی کوچک است و تعداد اقساط بیش از ${toPersianDigits(MAX_INSTALLMENTS)} تا می‌شود؛ مبلغ بزرگ‌تری وارد کنید`,
      );
    }
  } else {
    if (!Number.isInteger(installmentCount) || installmentCount <= 0) {
      throw new Error("تعداد اقساط باید بزرگ‌تر از صفر باشد");
    }
    if (installmentCount > MAX_INSTALLMENTS) {
      throw new Error(
        `تعداد اقساط نمی‌تواند بیش از ${toPersianDigits(MAX_INSTALLMENTS)} تا باشد`
      );
    }
    if (installmentCount > remainderR) {
      throw new Error(
        "تعداد اقساط نمی‌تواند بیشتر از مبلغ باقیمانده (به ریال) باشد",
      );
    }
    count = installmentCount;
    per = Math.floor(remainderR / count);
  }

  let remaining = remainderR;
  for (let i = 1; i <= count; i++) {
    const amount = i === count ? remaining : per;
    remaining -= amount;
    installments.push({
      n: i,
      month: monthFromOrdinal(effectiveRulingOrd + i),
      amount,
      balanceAfter: remaining,
    });
  }

  return {
    debt,
    start,
    ruling,
    indexStart: a.level,
    indexRuling: b.level,
    months: rulingOrd - startOrd,
    ratio,
    damages,
    total,
    cashPayment: cashR,
    remainder: remainderR,
    mode,
    installments,
  };
}

/***
 * خسارت تأخیر تأدیه on a single installment that is paid after its due month.
 *
 * damages = amount × (index at payment month ÷ index at due month) − amount
 * The CBI index is monthly, so a payment made in (or before) the due month
 * carries no delay damages and 0 is returned. Throws when the index of the
 * due month or of the payment month has not been published yet.
 */
export function installmentLateDamages({
  amount,
  due,
  paid,
  indices = publishedIndexSource,
}: {
  amount: number;
  due: JalaliMonth;
  paid: JalaliMonth;
  indices?: IndexSource;
}): number {
  if (!(amount > 0)) throw new Error("مبلغ قسط باید بزرگ‌تر از صفر باشد");
  if (monthOrdinal(paid) <= monthOrdinal(due)) return 0;
  const a = indices.getIndex(due);
  if (!a) {
    throw new Error(`شاخص ماه سررسید (${monthLabel(due)}) هنوز منتشر نشده است`);
  }
  const b = indices.getIndex(paid);
  if (!b) {
    throw new Error(
      `شاخص ماه پرداخت (${monthLabel(paid)}) هنوز منتشر نشده است`
    );
  }
  return amount * (b.level / a.level) - amount;
}

// ---------------------------------------------------------------------------
// Persian numerals & formatting
// ---------------------------------------------------------------------------

const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export function toPersianDigits(input: string | number): string {
  return String(input).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);
}

export function toLatinDigits(input: string): string {
  return input
    .replace(/[۰-۹]/g, (d) => String(FA_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

/** Grouped integer format, e.g. 43,140,345 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
    Math.round(value),
  );
}

export function formatPersianNumber(value: number): string {
  return toPersianDigits(formatNumber(value)).replace(/,/g, "٬");
}