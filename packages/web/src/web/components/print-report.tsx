import { digits, indexText, money, parseDate, type AppData, type Result } from "../lib/calculator";
import { INDEX_SOURCE_URL, matchesReference } from "../lib/default-indices";
import "../print-report.css";

export type CalculationTab = "standard" | "partial" | "installment";
const titles: Record<CalculationTab, string> = {
  standard: "گزارش محاسبه خسارت تأخیر تأدیه",
  partial: "گزارش محاسبه با پرداخت‌های میانی",
  installment: "گزارش محاسبه اقساط اعسار",
};
function NumberCell({ value }: { value: number }) {
  return <td className="print-number" dir="ltr">{money(value)}</td>;
}

export function PrintReport({ data, result, tab }: { data: AppData; result: Result | null; tab: CalculationTab }) {
  if (!result) return null;
  const values = data[tab];
  const end = tab === "installment" ? data.installment.ruling : data[tab].end;
  const usedIndices = [...new Map(result.stages.map(stage => [stage.date.slice(0, 7), { month: stage.date.slice(0, 7), value: String(stage.index) }])).values()];
  const customCount = usedIndices.filter(row => !matchesReference(row)).length;
  return <article className="print-report" dir="rtl" aria-label="گزارش قابل چاپ">
    <header className="print-report-header"><div><strong>دادسنج</strong><span>گزارش محاسبات · تقویم جلالی · مبالغ به ریال</span></div><h1>{titles[tab]}</h1></header>
    <section className="print-block">
      <h2>مشخصات محاسبه</h2>
      <dl className="print-inputs">
        <div><dt>{tab === "installment" ? "مبلغ محکوم‌به" : "اصل دین"}</dt><dd dir="ltr">{money(result.principal)} ریال</dd></div>
        <div><dt>تاریخ شروع</dt><dd dir="ltr">{parseDate(values.start)}</dd></div>
        <div><dt>{tab === "installment" ? "تاریخ حکم اعسار" : "تاریخ پایان"}</dt><dd dir="ltr">{parseDate(end)}</dd></div>
        {tab === "installment" && <>
          <div><dt>پیش‌پرداخت نقدی</dt><dd dir="ltr">{money(Number(digits(data.installment.initial || "0")))} ریال</dd></div>
          <div><dt>روش تعیین اقساط</dt><dd>{data.installment.mode === "count" ? "تعداد ثابت" : "سهم ثابت اصل هر قسط"}</dd></div>
          <div><dt>{data.installment.mode === "count" ? "تعداد اقساط درخواستی" : "سهم ثابت اصل هر قسط"}</dt><dd dir="ltr">{money(Number(digits(data.installment.value)))} {data.installment.mode === "count" ? "قسط" : "ریال"}</dd></div>
        </>}
      </dl>
    </section>
    <section className="print-block print-summary">
      <h2>نتیجه محاسبه</h2>
      <table><tbody>
        <tr><th>اصل دین / محکوم‌به</th><NumberCell value={result.principal}/></tr>
        <tr><th>خسارت محاسبه‌شده</th><NumberCell value={result.damages}/></tr>
        {tab === "partial" && <tr><th>مجموع پرداخت‌های میانی</th><NumberCell value={result.paid ?? 0}/></tr>}
        <tr className="print-total"><th>{tab === "partial" ? "مانده قابل پرداخت در پایان" : "مجموع قابل پرداخت"}</th><NumberCell value={result.total}/></tr>
      </tbody></table>
      <p>نسبت شاخص پایان به شروع: <b dir="ltr">{(result.endIndex / result.startIndex).toFixed(6)}</b></p>
      <p>{tab === "partial" ? "روش: مانده هر مرحله × نسبت شاخص جدید به قبلی − پرداخت همان مرحله؛ سپس به‌روزرسانی مانده تا پایان." : "روش: اصل دین × (شاخص پایان ÷ شاخص شروع)؛ خسارت برابر تفاوت مبلغ به‌روزشده و اصل دین است (با حداقل صفر)."}</p>
    </section>
    <section className="print-block">
      <h2>ریز محاسبات {tab === "installment" ? "و برنامه تقسیط" : "به ترتیب تاریخ"}</h2>
      {tab === "installment" && result.plan ? <>
        <p>پیش‌پرداخت فقط از اصل مبلغ کسر شده است. خسارت تا تاریخ حکم محاسبه و جدا از اصل، بین اقساط توزیع می‌شود. تاریخ سررسید اقساط در این محاسبه تعیین نشده است.</p>
        <table className="print-detail-table"><thead><tr><th>مرحله</th><th>سهم اصل</th><th>سهم خسارت</th><th>مبلغ پرداخت</th></tr></thead><tbody>
          {result.plan.map(row => <tr key={row.number}><td>{row.number === 0 ? "پیش‌پرداخت نقدی" : `قسط ${money(row.number)}`}</td><NumberCell value={row.principal}/><NumberCell value={row.damages}/><NumberCell value={row.total}/></tr>)}
          <tr className="print-total"><th>مجموع</th><NumberCell value={result.principal}/><NumberCell value={result.damages}/><NumberCell value={result.total}/></tr>
        </tbody></table>
      </> : <table className="print-detail-table"><thead><tr><th>مرحله</th><th>تاریخ جلالی</th><th>شاخص</th><th>مانده پیش از پرداخت</th><th>پرداخت</th><th>مانده پس از پرداخت</th></tr></thead><tbody>
        {result.stages.map((stage, i) => <tr key={i}><td>{stage.label}</td><td className="print-date" dir="ltr">{stage.date}</td><td dir="ltr">{indexText(stage.index)}</td><NumberCell value={stage.before}/><NumberCell value={stage.payment}/><NumberCell value={stage.after}/></tr>)}
      </tbody></table>}
      {tab === "partial" && <p>کنترل حسابداری: ماندهٔ پایان + پرداخت‌های میانی − اصل دین = {money(result.damages)} ریال خسارت (در صورت عدم کاهش شاخص).</p>}
    </section>
    <section className="print-block">
      <h2>شاخص‌های استفاده‌شده و وضعیت مرجع</h2>
      <table><thead><tr><th>ماه جلالی</th><th>عدد شاخص</th><th>وضعیت مقدار</th></tr></thead><tbody>
        {usedIndices.map(row => <tr key={row.month}><td dir="ltr">{row.month}</td><td dir="ltr">{indexText(Number(row.value))}</td><td>{matchesReference(row) ? "مطابق جدول مرجع بستهٔ برنامه" : "دادهٔ کاربر؛ نیازمند بررسی منبع و سال پایه"}</td></tr>)}
      </tbody></table>
      <p>مرجع بستهٔ برنامه: جدول بانک مرکزی، پایهٔ ۱۳۹۵ = ۱۰۰، پیوست نامهٔ ۰۲/۱۰۸۹۹ مورخ ۱۴۰۲/۰۱/۲۲، بازنشر اختبار؛ پوشش ۱۳۹۰/۰۱ تا ۱۴۰۱/۱۲. نشان «مطابق» صرفاً برابری ماه و عدد با این جدول را نشان می‌دهد.</p>
      <p className="print-source" dir="ltr">{INDEX_SOURCE_URL}</p>
      {customCount > 0 && <p className="print-warning">توجه: {money(customCount)} شاخص استفاده‌شده با مرجع بستهٔ برنامه تطبیق ندارد. این گزارش منبع یا سال پایهٔ آن‌ها را تأیید نمی‌کند؛ سری‌های متفاوت را ترکیب نکنید.</p>}
    </section>
    <footer className="print-report-footer">
      <p>مبالغ نمایشی به ریال کامل گرد شده‌اند؛ محاسبات مرحله‌ای با دقت کامل و تخصیص اقساط به ریال کامل انجام شده است.</p>
      <p>گزارش صرفاً محاسباتی است؛ احراز شرایط قانونی، تعیین مبدأ خسارت و تصمیم نهایی با مرجع رسیدگی است.</p>
      <span>دادسنج · نسخهٔ ۱.۲ · گزارش محاسبات مستقل</span>
    </footer>
  </article>;
}