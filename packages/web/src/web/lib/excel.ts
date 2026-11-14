import { Workbook, type Cell, type Worksheet } from "exceljs";
import { digits, parseMonth, type AppData, type Result } from "./calculator";
import { getIndex } from "./cpi";
import { matchesReference } from "./default-indices";
import { reportFingerprint } from "./fingerprint";

export type ExcelTab = "standard" | "partial" | "installment";

const titles: Record<ExcelTab, string> = {
  standard: "گزارش محاسبه خسارت تأخیر تأدیه",
  partial: "گزارش محاسبه با پرداخت‌های میانی",
  installment: "گزارش محاسبه اقساط اعسار",
};

const RIAL = "#,##0";
const INDEX_FORMAT = "0.####";

/** Column widths per sheet (RTL: first logical column starts at the right). */
function setupSheet(sheet: Worksheet, widths: number[]): void {
  sheet.views = [{ rightToLeft: true, showGridLines: false }];
  sheet.pageSetup = {
    paperSize: 9, // A4
    orientation: "portrait",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
  };
  widths.forEach((width, i) => {
    sheet.getColumn(i + 1).width = width;
  });
}

function addTitle(sheet: Worksheet, columns: number, title: string, subtitle: string): void {
  sheet.mergeCells(1, 1, 1, columns);
  const heading = sheet.getCell(1, 1);
  heading.value = title;
  heading.font = { bold: true, size: 14, color: { argb: "FF241B3D" } };
  heading.alignment = { horizontal: "right", vertical: "middle" };
  sheet.getRow(1).height = 30;

  sheet.mergeCells(2, 1, 2, columns);
  const note = sheet.getCell(2, 1);
  note.value = subtitle;
  note.font = { size: 10, color: { argb: "FF6B647F" } };
  note.alignment = { horizontal: "right", vertical: "middle" };
  sheet.getRow(2).height = 20;
}

function addTableHeader(sheet: Worksheet, row: number, headers: string[]): void {
  headers.forEach((header, i) => {
    const cell = sheet.getCell(row, i + 1);
    cell.value = header;
    cell.font = { bold: true, color: { argb: "FF2B1E52" } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEDE8FB" } };
    cell.border = {
      top: { style: "thin", color: { argb: "FFC9C0E4" } },
      bottom: { style: "thin", color: { argb: "FFC9C0E4" } },
      left: { style: "thin", color: { argb: "FFC9C0E4" } },
      right: { style: "thin", color: { argb: "FFC9C0E4" } },
    };
  });
  sheet.getRow(row).height = 26;
}

function styleDataRow(sheet: Worksheet, row: number, columns: number): void {
  for (let i = 1; i <= columns; i++) {
    const cell = sheet.getCell(row, i);
    cell.alignment = {
      horizontal: i === 1 ? "right" : "center",
      vertical: "middle",
      wrapText: true,
    };
    cell.border = {
      bottom: { style: "hair", color: { argb: "FFD9D3EC" } },
    };
  }
}

function setNumber(cell: Cell, value: number, format: string): void {
  cell.value = value;
  cell.numFmt = format;
  cell.alignment = { horizontal: "left", vertical: "middle" };
}

function addedDate(): string {
  try {
    return new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function usedIndices(result: Result): { month: string; value: string }[] {
  return [
    ...new Map(
      result.stages.map((stage) => [
        stage.date.slice(0, 7),
        { month: stage.date.slice(0, 7), value: String(stage.index) },
      ]),
    ).values(),
  ];
}

/** File name stays ASCII so it is safe on every desktop and browser. */
export function excelFileName(tab: ExcelTab, data: AppData): string {
  const end = tab === "installment" ? data.installment.ruling : data[tab].end;
  const stamp = digits(end).replace(/[^0-9]/g, "-").replace(/^-+|-+$/g, "");
  return `dadsanj-${tab}-${stamp || "report"}.xlsx`;
}

export interface ExcelReportInput {
  data: AppData;
  result: Result;
  tab: ExcelTab;
}

/**
 * Builds the calculation workbook: summary, itemized stages or installment
 * plan, and the monthly indices used in the report. All amounts stay numeric
 * cells (rial format) so the workbook remains usable in Excel.
 */
export async function buildExcelReport({ data, result, tab }: ExcelReportInput): Promise<Blob> {
  const workbook = new Workbook();
  workbook.creator = "دادسنج";
  workbook.company = "دادسنج";
  workbook.title = titles[tab];
  workbook.created = new Date();

  const summary = workbook.addWorksheet("خلاصه");
  setupSheet(summary, [34, 32]);
  addTitle(summary, 2, titles[tab], "گزارش محاسبات · تقویم جلالی · مبالغ به ریال");

  const end = tab === "installment" ? data.installment.ruling : data[tab].end;
  const rows: [string, string | number, string?][] = [
    ["اصل دین / محکوم‌به", result.principal, "rial"],
    ["تاریخ شروع محاسبه", data[tab].start],
    [tab === "installment" ? "تاریخ صدور حکم اعسار" : "تاریخ پایان محاسبه", end],
  ];
  if (tab === "installment") {
    rows.push(
      ["پیش‌پرداخت نقدی", Number(digits(data.installment.initial || "0")) || 0, "rial"],
      ["روش تعیین اقساط", data.installment.mode === "count" ? "تعداد اقساط ثابت" : "مبلغ اصلِ هر قسط ثابت"],
      [
        data.installment.mode === "count" ? "تعداد اقساط" : "سهم ثابت اصل در هر قسط",
        Number(digits(data.installment.value)) || 0,
        data.installment.mode === "count" ? "0" : "rial",
      ],
    );
  }
  rows.push(
    ["خسارت محاسبه‌شده", result.damages, "rial"],
    [tab === "partial" ? "مانده قابل پرداخت در پایان" : "مجموع قابل پرداخت", result.total, "rial"],
    ["شاخص شروع", result.startIndex, "index"],
    ["شاخص پایان", result.endIndex, "index"],
    ["نسبت شاخص پایان به شروع", result.endIndex / result.startIndex, "0.000000"],
    ["شناسهٔ گزارش", reportFingerprint(data, result, tab)],
    ["تاریخ تهیه گزارش", addedDate()],
  );
  if (tab === "partial") {
    rows.splice(4, 0, ["مجموع پرداخت‌های میانی", result.paid ?? 0, "rial"]);
  }

  let rowNumber = 4;
  for (const [label, value, format] of rows) {
    const labelCell = summary.getCell(rowNumber, 1);
    labelCell.value = label;
    labelCell.font = { bold: true, color: { argb: "FF3A3153" } };
    labelCell.alignment = { horizontal: "right", vertical: "middle" };
    labelCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF7F4FE" } };

    const valueCell = summary.getCell(rowNumber, 2);
    if (format === "rial") setNumber(valueCell, Number(value), RIAL);
    else if (format === "index") setNumber(valueCell, Number(value), INDEX_FORMAT);
    else if (format) setNumber(valueCell, Number(value), format);
    else {
      valueCell.value = String(value);
      valueCell.alignment = { horizontal: "left", vertical: "middle" };
    }
    styleDataRow(summary, rowNumber, 2);
    rowNumber += 1;
  }

  summary.mergeCells(rowNumber + 1, 1, rowNumber + 1, 2);
  const method = summary.getCell(rowNumber + 1, 1);
  method.value =
    tab === "partial"
      ? "روش: مانده هر مرحله × نسبت شاخص جدید به قبلی − پرداخت همان مرحله؛ سپس به‌روزرسانی مانده تا پایان."
      : tab === "installment"
        ? "روش: خسارت تا تاریخ حکم اعسار محاسبه و جدا از اصل، بین اقساط توزیع شده است."
        : "روش: اصل دین × (شاخص پایان ÷ شاخص شروع)؛ خسارت برابر تفاوت مبلغ به‌روزشده و اصل دین است.";
  method.font = { size: 9, color: { argb: "FF6B647F" } };
  method.alignment = { horizontal: "right", vertical: "top", wrapText: true };
  summary.getRow(rowNumber + 1).height = 38;

  const detail = workbook.addWorksheet("ریز محاسبات");
  const detailColumns = tab === "installment" ? 4 : 6;
  setupSheet(detail, tab === "installment" ? [20, 20, 20, 20] : [26, 16, 14, 22, 18, 22]);
  addTitle(detail, detailColumns, tab === "installment" ? "برنامه پرداخت اقساط" : "ریز محاسبات به ترتیب تاریخ", titles[tab]);

  let detailRow = 4;
  if (tab === "installment" && result.plan) {
    addTableHeader(detail, detailRow++, ["مرحله", "سهم اصل", "سهم خسارت", "مبلغ پرداخت"]);
    for (const plan of result.plan) {
      detail.getCell(detailRow, 1).value = plan.number === 0 ? "پیش‌پرداخت نقدی" : `قسط ${plan.number}`;
      setNumber(detail.getCell(detailRow, 2), plan.principal, RIAL);
      setNumber(detail.getCell(detailRow, 3), plan.damages, RIAL);
      setNumber(detail.getCell(detailRow, 4), plan.total, RIAL);
      styleDataRow(detail, detailRow, 4);
      detailRow += 1;
    }
    detail.getCell(detailRow, 1).value = "مجموع";
    setNumber(detail.getCell(detailRow, 2), result.principal, RIAL);
    setNumber(detail.getCell(detailRow, 3), result.damages, RIAL);
    setNumber(detail.getCell(detailRow, 4), result.total, RIAL);
    for (let i = 1; i <= 4; i++) {
      const cell = detail.getCell(detailRow, i);
      cell.font = { bold: true };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF7F4FE" } };
      cell.border = { top: { style: "thin", color: { argb: "FFC9C0E4" } } };
    }
  } else {
    addTableHeader(detail, detailRow++, ["مرحله", "تاریخ جلالی", "شاخص", "مانده پیش از پرداخت", "پرداخت", "مانده پس از پرداخت"]);
    for (const stage of result.stages) {
      detail.getCell(detailRow, 1).value = stage.label;
      detail.getCell(detailRow, 2).value = stage.date;
      setNumber(detail.getCell(detailRow, 3), stage.index, INDEX_FORMAT);
      setNumber(detail.getCell(detailRow, 4), stage.before, RIAL);
      setNumber(detail.getCell(detailRow, 5), stage.payment, RIAL);
      setNumber(detail.getCell(detailRow, 6), stage.after, RIAL);
      styleDataRow(detail, detailRow, 6);
      detailRow += 1;
    }
  }
  detailRow += 1;
  detail.mergeCells(detailRow, 1, detailRow, detailColumns);
  const detailNote = detail.getCell(detailRow, 1);
  detailNote.value =
    "مبالغ نمایشی به ریال کامل گرد شده‌اند؛ محاسبات مرحله‌ای با دقت کامل انجام شده است. گزارش صرفاً محاسباتی است و تصمیم نهایی با مرجع رسیدگی است.";
  detailNote.font = { size: 9, color: { argb: "FF6B647F" } };
  detailNote.alignment = { horizontal: "right", vertical: "top", wrapText: true };
  detail.getRow(detailRow).height = 32;

  const indices = workbook.addWorksheet("شاخص‌های استفاده‌شده");
  setupSheet(indices, [20, 20, 18, 44]);
  addTitle(indices, 4, "شاخص‌های استفاده‌شده و وضعیت مرجع", "پایهٔ ۱۳۹۵ = ۱۰۰ · پوشش پیش‌فرض ۱۳۷۵/۰۱ تا ۱۴۰۵/۰۷");
  addTableHeader(indices, 4, ["ماه جلالی", "عدد شاخص", "تغییر سالانه", "وضعیت مقدار"]);
  let indexRow = 5;
  for (const used of usedIndices(result)) {
    indices.getCell(indexRow, 1).value = used.month;
    setNumber(indices.getCell(indexRow, 2), Number(used.value), INDEX_FORMAT);
    let inflation: number | null = null;
    try {
      const [year, month] = parseMonth(used.month).split("/").map(Number);
      inflation = getIndex({ year, month })?.inflation ?? null;
    } catch {
      inflation = null;
    }
    if (inflation === null) indices.getCell(indexRow, 3).value = "—";
    else setNumber(indices.getCell(indexRow, 3), inflation, "0.00");
    indices.getCell(indexRow, 4).value = matchesReference(used)
      ? "مطابق جدول مرجع بستهٔ برنامه"
      : "دادهٔ کاربر؛ نیازمند بررسی منبع و سال پایه";
    styleDataRow(indices, indexRow, 4);
    indexRow += 1;
  }
  indexRow += 1;
  indices.mergeCells(indexRow, 1, indexRow, 4);
  const sourceNote = indices.getCell(indexRow, 1);
  sourceNote.value =
    "مرجع بستهٔ برنامه: جدول بانک مرکزی، پایهٔ ۱۳۹۵ = ۱۰۰؛ نشان «مطابق» صرفاً برابری ماه و عدد با این جدول را نشان می‌دهد. شاخص‌های با سال پایه یا سری متفاوت را ترکیب نکنید.";
  sourceNote.font = { size: 9, color: { argb: "FF6B647F" } };
  sourceNote.alignment = { horizontal: "right", vertical: "top", wrapText: true };

  if (result.segments && result.segments.length > 0) {
    const yearly = workbook.addWorksheet("ریز سالانه");
    setupSheet(yearly, [22, 16, 16, 12, 22, 20]);
    addTitle(yearly, 6, "ریز سالانهٔ خسارت", "هر سطر یک سال (یا پارهٔ پایانی) از زنجیرهٔ شاخص است");
    addTableHeader(yearly, 4, ["بازه", "شاخص شروع", "شاخص پایان", "نسبت", "مبلغ به‌روزشده", "خسارت دوره"]);
    let yearlyRow = 5;
    for (const segment of result.segments) {
      yearly.getCell(yearlyRow, 1).value = `${segment.from} → ${segment.to}`;
      setNumber(yearly.getCell(yearlyRow, 2), segment.indexFrom, INDEX_FORMAT);
      setNumber(yearly.getCell(yearlyRow, 3), segment.indexTo, INDEX_FORMAT);
      setNumber(yearly.getCell(yearlyRow, 4), segment.ratio, "0.0000");
      setNumber(yearly.getCell(yearlyRow, 5), segment.total, RIAL);
      setNumber(yearly.getCell(yearlyRow, 6), segment.damages, RIAL);
      styleDataRow(yearly, yearlyRow, 6);
      yearlyRow += 1;
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([new Uint8Array(buffer as ArrayBuffer)], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

export async function blobToBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  const chunk = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunk) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunk));
  }
  return btoa(binary);
}

export function downloadExcel(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
