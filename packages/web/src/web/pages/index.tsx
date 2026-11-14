import { useEffect, useRef, useState, type ReactNode } from "react";
import "../index-defaults.css";
import { Activity, ArrowLeft, ArrowUpLeft, BookOpen, CalendarDays, ChevronLeft, CircleHelp, Database, Download, FileClock, FileText, History, Layers3, Plus, Printer, ReceiptText, RotateCcw, Scale, ShieldCheck, Sparkles, Trash2, Upload } from "lucide-react";
import { useDesktop } from "../hooks/use-desktop";
import { PrintReport } from "../components/print-report";
import { CaseBar } from "../components/case-bar";
import { JalaliDatePicker } from "../components/jalali-date-picker";
import { buildExcelReport, blobToBase64, downloadExcel, excelFileName } from "../lib/excel";
import { getIndex as publishedIndex } from "../lib/cpi";
import { calculateInstallment, calculateLateInstallment, calculatePartial, calculateStandard, digits, emptyData, indexText, money, parseMonth, type AppData, type Result } from "../lib/calculator";
import { fromIni, toIni } from "../lib/ini";
import { addMissingDefaults, DEFAULT_INDICES_REVISION, INDEX_SOURCE_URL, INDEX_TABLE_URL, initializeData, matchesReference } from "../lib/default-indices";
import { activeCase, addCase, createWorkspace, deleteCase, duplicateCase, loadWorkspace, restoreWorkspaceBackup, saveWorkspace, withCaseData, withCaseName, type Workspace } from "../lib/workspace";
import { coverageBetween } from "../lib/coverage";

type Tab = "standard" | "partial" | "installment" | "indices";
type CalcTab = Exclude<Tab, "indices">;
const tabs = [
  { id: "standard" as const, label: "محاسبه خسارت", short: "محاسبه پایه", icon: FileClock, number: "01" },
  { id: "partial" as const, label: "پرداخت‌های میانی", short: "چند پرداختی", icon: Layers3, number: "02" },
  { id: "installment" as const, label: "اقساط اعسار", short: "حکم تقسیط", icon: Scale, number: "03" },
  { id: "indices" as const, label: "مدیریت شاخص‌ها", short: "داده‌های شاخص", icon: Database, number: "04" },
];
const blurDate = "مثال: ۱۴۰۳/۰۱/۱۵";

function Field({ label, value, onChange, placeholder, help, suffix, wide }: { label: string; value: string; onChange: (v:string)=>void; placeholder?: string; help?: string; suffix?: ReactNode; wide?: boolean }) {
  return <label className={`field ${wide ? "field-wide" : ""}`}><span className="field-label">{label}</span><span className="input-wrap"><input aria-label={label} dir="ltr" inputMode="decimal" value={value} placeholder={placeholder} onChange={e=>onChange(e.target.value)} /><span className="input-suffix">{suffix}</span></span>{help && <small>{help}</small>}</label>;
}
function DateField({ label, value, onChange, wide }: { label: string; value: string; onChange: (v:string)=>void; wide?: boolean }) {
  return <label className={`field ${wide ? "field-wide" : ""}`}><span className="field-label">{label}</span><JalaliDatePicker ariaLabel={label} value={value} onChange={onChange} placeholder={blurDate} /></label>;
}
function CardHeading({ n, title, subtitle }: { n: string; title: string; subtitle?: string }) {
  return <div className="card-heading"><span className="section-count">{n}</span><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div></div>;
}

function inflationOf(month: string): string {
  try {
    const [year, monthNumber] = parseMonth(month).split("/").map(Number);
    const entry = publishedIndex({ year, month: monthNumber });
    return entry?.inflation == null ? "—" : `${indexText(entry.inflation)}٪`;
  } catch {
    return "—";
  }
}

function IndexManager({ data, setData }: { data: AppData; setData: (d: AppData)=>void }) {
  const [month, setMonth] = useState("");
  const [value, setValue] = useState("");
  const [message, setMessage] = useState("");
  const rows = [...data.indices].sort((a,b)=> b.month.localeCompare(a.month));
  function add() {
    try {
      const key = parseMonth(month);
      const v = Number(digits(value));
      if (!Number.isFinite(v) || v <= 0) throw Error("مقدار شاخص باید عددی مثبت باشد.");
      if (data.indices.some(r=> {try {return parseMonth(r.month) === key;} catch {return false;}})) throw Error("برای این ماه شاخص ثبت شده است؛ همان ردیف را ویرایش کنید.");
      setData({ ...data, indices: [...data.indices, { month: key, value: digits(value) }] }); setMonth(""); setValue(""); setMessage("");
    } catch(e) { setMessage((e as Error).message); }
  }
  return <div className="index-layout">
    <div className="panel index-panel"><CardHeading n="DATA / 01" title="آرشیو شاخص به تفکیک ماه" subtitle="پیش‌فرض: جدول بانک مرکزی، سال پایهٔ ۱۳۹۵ = ۱۰۰؛ ثبت و ویرایش دستی نیز ممکن است." />
      <div className="table-toolbar"><span className="soft-label">{money(rows.length)} ماه ثبت‌شده</span><span className="soft-label">مرتب‌سازی: جدیدترین ابتدا</span></div>
      <div className="table-scroll"><table className="data-table"><thead><tr><th>ماه جلالی</th><th>مقدار شاخص</th><th>تغییر سالانه</th><th>وضعیت</th><th>عملیات</th></tr></thead><tbody>{rows.length ? rows.map(row => {
        const original = data.indices.indexOf(row);
        return <tr key={original}><td><input aria-label={`ماه شاخص ${row.month}`} className="table-input month-cell" dir="ltr" value={row.month} onChange={e=>setData({...data,indices:data.indices.map((r,i)=>i===original?{...r,month:e.target.value}:r)})} /></td><td><input aria-label={`مقدار شاخص ${row.month}`} className="table-input" dir="ltr" inputMode="decimal" value={row.value} onChange={e=>setData({...data,indices:data.indices.map((r,i)=>i===original?{...r,value:e.target.value}:r)})} /></td><td className="inflation-cell" dir="ltr">{inflationOf(row.month)}</td><td><span className="tiny-status"><span /> {matchesReference(row) ? "مطابق جدول مرجع" : "دادهٔ کاربر"}</span></td><td><button aria-label={`حذف شاخص ${row.month}`} className="icon-button" title="حذف شاخص" onClick={()=>setData({...data,indices:data.indices.filter((_,i)=>i!==original)})}><Trash2 size={16}/></button></td></tr>;
      }) : null}</tbody></table>{!rows.length && <div className="table-empty"><Database size={28}/><strong>هنوز شاخصی ثبت نشده است</strong><span>فایل INI را وارد کنید یا اولین ماه را در بخش روبه‌رو اضافه کنید.</span></div>}</div>
    </div>
    <div className="side-stack"><div className="panel small-panel"><CardHeading n="DATA / 02" title="افزودن شاخص" subtitle="هر ماه یک مقدار شاخص دارد." /><div className="fields one"><Field label="ماه جلالی" value={month} onChange={setMonth} placeholder="۱۴۰۳/۰۱" suffix={<CalendarDays size={16}/>} /><Field label="عدد شاخص" value={value} onChange={setValue} placeholder="مثال: ۳۵۰٫۲" /></div>{message && <p className="error-text">{message}</p>}<button className="primary-button full" onClick={add}><Plus size={17}/> افزودن به آرشیو</button></div>
    <div className="info-panel"><ShieldCheck size={20}/><strong>منبع شاخص‌های پیش‌فرض</strong><p>۳۶۷ ماه از ۱۳۷۵/۰۱ تا ۱۴۰۵/۰۷؛ سال پایهٔ ۱۳۹۵ = ۱۰۰. اعداد از سری شاخص بهای کالاها و خدمات مصرفی بانک مرکزی (پایهٔ ۱۳۹۵) گرفته شده‌اند؛ بخش ۱۳۹۰ تا ۱۴۰۱ با تصویر جدول پیوست نامهٔ ۰۲/۱۰۸۹۹ مورخ ۱۴۰۲/۰۱/۲۲ تطبیق داده شده است.</p><p>بررسی منبع: ۱۴۰۵/۰۸/۰۴ (۲۰۲۶/۱۰/۲۶). برای ماه‌های پس از ۱۴۰۵/۰۷ عددی در سری موجود نیست؛ هیچ عدد تخمینی اضافه نشده است. شاخص‌ها خودکار از اینترنت به‌روز نمی‌شوند.</p><p><a href={INDEX_SOURCE_URL} target="_blank" rel="noreferrer">مشاهدهٔ نامه و منبع ↗</a> · <a href={INDEX_TABLE_URL} target="_blank" rel="noreferrer">تصویر جدول بانک مرکزی ↗</a></p><button className="outline-button full" onClick={()=>{const next=addMissingDefaults(data);setData(next);setMessage(`${money(next.indices.length-data.indices.length)} ماه اضافه شد؛ مقادیر موجود تغییر نکرد.`);}}><Database size={16}/> افزودن پیش‌فرض‌های مفقود</button><p>داده‌های قبلی و تغییرات شما حفظ می‌شوند. شاخص‌های با سال پایه یا سری متفاوت را ترکیب نکنید. ذخیره در دسکتاپ به صورت INI روی دستگاه است.</p></div></div>
  </div>;
}

function ResultPanel({ result, error, tab, onIndices }: {result: Result|null; error:string; tab:Tab; onIndices:()=>void}) {
  return <div className="result-column"><div className="result-panel">
    <div className="result-header"><div className="result-kicker"><Activity size={16}/> خروجی محاسبه</div><span className="live-pill"><span/> {result ? "محاسبه‌شده" : "در انتظار ورودی"}</span></div>
    {error && <div className="error-box"><CircleHelp size={18}/><span>{error}</span></div>}
    {result ? <>
      <div className="result-main"><span>{tab === "partial" ? "مانده قابل پرداخت در پایان" : "مجموع قابل پرداخت"}</span><div className="hero-number" dir="ltr">{money(result.total)} <small>ریال</small></div><div className="result-bar"><span>بر اساس شاخص‌های واردشده</span><span dir="ltr">{indexText(result.startIndex)} → {indexText(result.endIndex)}</span></div></div>
      <div className="metric-lines"><div><span>اصل دین / محکوم‌به</span><strong dir="ltr">{money(result.principal)}</strong></div><div><span>خسارت محاسبه‌شده</span><strong className="violet" dir="ltr">{money(result.damages)}</strong></div>{tab === "partial" && <div><span>مجموع پرداخت‌های میانی</span><strong dir="ltr">{money(result.paid ?? 0)}</strong></div>}{tab === "installment" && <div><span>تعداد ردیف‌های برنامه</span><strong dir="ltr">{money(result.plan?.length ?? 0)}</strong></div>}</div>
      <div className="ratio-line"><span>نسبت شاخص پایان به شروع</span><strong dir="ltr">{(result.endIndex/result.startIndex).toFixed(4)} ×</strong></div>
    </> : <div className="result-placeholder"><div className="orb"><Sparkles size={28}/></div><h3>محاسبهٔ شفاف، مرحله به مرحله</h3><p>داده‌ها را وارد کنید و «محاسبه خسارت» را بزنید. نتیجه و جزئیات هر مرحله اینجا نمایش داده می‌شود.</p><button className="text-action" onClick={onIndices}>بررسی شاخص‌های ماهانه <ArrowLeft size={16}/></button></div>}
  </div><div className="note-panel"><BookOpen size={18}/><p>مبنای محاسبه، نسبت اعداد شاخص متناظر با ماه پایان و شروع است؛ نه درصد تورم. پیش‌فرض‌های شاخص تا مهر ۱۴۰۵ موجودند. برای تاریخ‌های دیگر شاخص معتبر با همان سال پایه ثبت کنید. این ابزار جایگزین بررسی حقوقی پرونده نیست.</p></div></div>;
}

function Breakdown({ result, tab }: {result:Result; tab:Tab}) {
  return <div className="panel breakdown"><CardHeading n="DETAIL / 02" title={tab === "installment" ? "برنامه پرداخت اقساط" : "ریز محاسبات"} subtitle={tab === "installment" ? "پیش‌پرداخت فقط از اصل مبلغ کسر شده؛ خسارت جداگانه بین اقساط تقسیم شده است." : "گرد کردن تنها در خروجی نهایی انجام می‌شود؛ مراحل با دقت کامل محاسبه شده‌اند."}/>
    {tab === "installment" && result.plan ? <div className="table-scroll"><table className="data-table"><thead><tr><th>مرحله</th><th>سهم اصل</th><th>سهم خسارت</th><th>مبلغ پرداخت</th></tr></thead><tbody>{result.plan.map(row=><tr key={row.number}><td>{row.number === 0 ? "پیش‌پرداخت نقدی" : `قسط ${money(row.number)}`}</td><td dir="ltr">{money(row.principal)}</td><td dir="ltr">{money(row.damages)}</td><td className="bright" dir="ltr">{money(row.total)}</td></tr>)}</tbody><tfoot><tr><td>مجموع</td><td dir="ltr">{money(result.principal)}</td><td dir="ltr">{money(result.damages)}</td><td dir="ltr">{money(result.total)}</td></tr></tfoot></table></div> : <div className="table-scroll"><table className="data-table"><thead><tr><th>مرحله</th><th>تاریخ</th><th>شاخص</th><th>مانده پیش از پرداخت</th><th>پرداخت</th><th>مانده پس از پرداخت</th></tr></thead><tbody>{result.stages.map((s,i)=><tr key={i}><td>{s.label}</td><td dir="ltr">{s.date}</td><td dir="ltr">{indexText(s.index)}</td><td dir="ltr">{money(s.before)}</td><td dir="ltr">{money(s.payment)}</td><td className="bright" dir="ltr">{money(s.after)}</td></tr>)}</tbody></table></div>}
    {tab === "partial" && <p className="audit-foot">کنترل حسابداری: ماندهٔ پایان + پرداخت‌های میانی − اصل دین = {money(result.damages)} ریال خسارت محاسبه‌شده (در صورت عدم کاهش شاخص).</p>}
    {result.segments && result.segments.length > 0 && <>
      <h3 className="breakdown-subtitle">ریز سالانه</h3>
      <div className="table-scroll"><table className="data-table"><thead><tr><th>بازه</th><th>شاخص شروع</th><th>شاخص پایان</th><th>نسبت</th><th>مبلغ به‌روزشده</th><th>خسارت دوره</th></tr></thead><tbody>{result.segments.map((s,i)=><tr key={i}><td dir="ltr">{s.from} → {s.to}</td><td dir="ltr">{indexText(s.indexFrom)}</td><td dir="ltr">{indexText(s.indexTo)}</td><td dir="ltr">{s.ratio.toFixed(4)}</td><td dir="ltr">{money(s.total)}</td><td className="bright" dir="ltr">{money(s.damages)}</td></tr>)}</tbody></table></div>
    </>}
  </div>;
}

function CoverageNote({ data, tab }: { data: AppData; tab: Tab }) {
  if (tab === "indices") return null;
  const end = tab === "installment" ? data.installment.ruling : data[tab].end;
  const info = coverageBetween(data.indices, data[tab].start, end);
  if (!info) return null;
  if (info.missing.length === 0) {
    return <p className="coverage-note ok"><ShieldCheck size={15}/> همهٔ {money(info.totalMonths)} ماه بازه ({info.from} تا {info.to}) شاخص دارند.</p>;
  }
  const preview = info.missing.slice(0, 4).join("، ");
  return <p className="coverage-note warn"><CircleHelp size={15}/> {money(info.missing.length)} ماه از {money(info.totalMonths)} ماه بازه شاخص ندارد ({preview}{info.missing.length > 4 ? " و …" : ""}). پیش از محاسبه، شاخص این ماه‌ها را ثبت کنید.</p>;
}

function LateInstallmentCard({ data }: { data: AppData }) {
  const [amount, setAmount] = useState("");
  const [due, setDue] = useState("");
  const [paid, setPaid] = useState("");
  const [outcome, setOutcome] = useState<{ damages: number } | { error: string } | null>(null);
  function calculate() {
    try {
      setOutcome({ damages: calculateLateInstallment(data, { amount, due, paid }) });
    } catch (error) {
      setOutcome({ error: (error as Error).message });
    }
  }
  return <div className="panel extra-panel late-panel">
    <CardHeading n="INPUT / 03" title="خسارت تأخیر یک قسط" subtitle="برای هر قسط پرداخت‌شده پس از سررسید، خسارت را جداگانه محاسبه کنید." />
    <div className="fields">
      <Field label="مبلغ قسط" value={amount} onChange={setAmount} placeholder="مثال: ۲۰٬۰۰۰٬۰۰۰" suffix="ریال" wide />
      <DateField label="ماه سررسید" value={due} onChange={setDue} />
      <DateField label="ماه پرداخت" value={paid} onChange={setPaid} />
    </div>
    <button className="outline-button" onClick={calculate}><CalendarDays size={16}/> محاسبهٔ خسارت این قسط</button>
    {outcome && "damages" in outcome && <div className="late-result"><span>خسارت تأخیر این قسط</span><strong dir="ltr">{money(outcome.damages)} ریال</strong></div>}
    {outcome && "error" in outcome && <p className="error-text">{outcome.error}</p>}
  </div>;
}

function Index() {
  const desktop = useDesktop();
  const inputRef = useRef<HTMLInputElement>(null);
  const lastSavedRef = useRef("");
  const [tab,setTab] = useState<Tab>("standard");
  const [workspace,setWorkspace] = useState<Workspace | null>(null);
  const [ready,setReady] = useState(false);
  const [canSave,setCanSave] = useState(false);
  const [saveState,setSaveState] = useState("در حال بارگذاری");
  const [toast,setToast] = useState("");
  const [result,setResult] = useState<Result|null>(null);
  const resultRef = useRef(result);
  resultRef.current = result;
  const [printing,setPrinting] = useState(false);
  const [excelBusy,setExcelBusy] = useState(false);
  const [error,setError] = useState("");
  const data = workspace ? activeCase(workspace).data : emptyData;

  const setData = (next:AppData) => {
    setWorkspace(current => current ? withCaseData(current, current.activeId, next) : current);
    setResult(null);
    setError("");
  };
  const resetResult = () => { setResult(null); setError(""); };

  useEffect(()=>{
    let active = true;
    setCanSave(false);
    (async()=>{
      try {
        let loaded = await loadWorkspace(desktop);
        if (!loaded) {
          const legacy = desktop ? await desktop.readDataIni() : localStorage.getItem("damages-data-ini");
          loaded = createWorkspace(initializeData(legacy ? fromIni(legacy) : undefined));
          await saveWorkspace(desktop, loaded);
        }
        if(active){
          lastSavedRef.current = JSON.stringify(loaded);
          setWorkspace(loaded);
          setCanSave(true);
          setSaveState("داده‌ها آماده‌اند");
        }
      } catch(e) {
        if(active) setSaveState(`خطا در بارگذاری؛ ذخیره خودکار متوقف است: ${(e as Error).message}`);
      } finally {
        if(active) setReady(true);
      }
    })();
    return ()=>{ active = false; };
  },[desktop]);

  useEffect(()=>{
    if(!ready || !canSave || !workspace) return;
    const content = JSON.stringify(workspace);
    if (content === lastSavedRef.current) return;
    setSaveState("در حال ذخیره...");
    const timer = setTimeout(async()=>{
      try {
        await saveWorkspace(desktop, workspace);
        lastSavedRef.current = content;
        setSaveState("ذخیره‌شده در فایل فضای کار");
      } catch(e) {
        setSaveState(`خطا در ذخیره: ${(e as Error).message}`);
      }
    },350);
    return ()=>clearTimeout(timer);
  },[workspace,ready,canSave,desktop]);

  useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(""),4200);return()=>clearTimeout(t);},[toast]);

  function switchCase(id:string) {
    setWorkspace(current => current ? {...current, activeId:id} : current);
    resetResult();
  }
  function addNewCase() {
    setWorkspace(current => current ? addCase(current, initializeData()) : current);
    resetResult();
  }
  function copyCase() {
    setWorkspace(current => current ? duplicateCase(current, current.activeId) : current);
    resetResult();
  }
  function removeCase() {
    if (!workspace || workspace.cases.length <= 1) return;
    if (!window.confirm(`پروندهٔ «${activeCase(workspace).name}» حذف شود؟ این کار قابل بازگشت نیست.`)) return;
    setWorkspace(current => current ? deleteCase(current, current.activeId) : current);
    resetResult();
  }
  function renameCase(name:string) {
    setWorkspace(current => current ? withCaseName(current, current.activeId, name) : current);
  }
  async function onRestoreBackup() {
    if (!window.confirm("آخرین نسخهٔ پشتیبان بازیابی شود؟ تغییرات ذخیره‌نشده از بین می‌روند.")) return;
    try {
      const restored = await restoreWorkspaceBackup(desktop);
      if (!restored) { setToast("نسخهٔ پشتیبانی برای بازیابی پیدا نشد."); return; }
      lastSavedRef.current = "";
      setWorkspace(restored);
      resetResult();
      setToast("نسخهٔ پشتیبان بازیابی شد.");
    } catch(e) {
      setToast(`خطا در بازیابی: ${(e as Error).message}`);
    }
  }

  async function importText(content:string){
    try {
      const imported={...fromIni(content),defaultsRevision:DEFAULT_INDICES_REVISION};
      setData(imported);
      setTab("indices");
      setToast(`${money(imported.indices.length)} شاخص در پروندهٔ فعال بارگذاری شد؛ برای افزودن ماه‌های مرجع، دکمهٔ پیش‌فرض‌های مفقود را بزنید.`);
    } catch(e){setToast(`خطا: ${(e as Error).message}`);}
  }
  async function onImport(){
    try {
      if(desktop){
        const paths=await desktop.showOpenDialog({title:"انتخاب فایل شاخص و داده‌ها",filters:[{name:"INI",extensions:["ini"]}],properties:["openFile"]});
        if(paths[0]) await importText(await desktop.readFile(paths[0]));
      } else inputRef.current?.click();
    } catch(e){setToast(`خطا در خواندن فایل: ${(e as Error).message}`);}
  }
  async function onExport(){
    try {
      const text=toIni(data);
      if(desktop){
        const path=await desktop.showSaveDialog({title:"ذخیره داده‌های پروندهٔ فعال به صورت INI",defaultPath:"damages-data.ini",filters:[{name:"INI",extensions:["ini"]}]});
        if(path){await desktop.writeFile(path,text);setToast("فایل INI ذخیره شد.");}
      } else {
        const url=URL.createObjectURL(new Blob([text],{type:"text/plain;charset=utf-8"}));
        const a=document.createElement("a");a.href=url;a.download="damages-data.ini";a.click();URL.revokeObjectURL(url);
        setToast("فایل INI دانلود شد.");
      }
    } catch(e){setToast(`خطا در ذخیره فایل: ${(e as Error).message}`);}
  }
  const update = (section:CalcTab, key:string, val:string) => setData({...data,[section]:{...data[section],[key]:val}});
  function run(){
    if (tab === "indices") return;
    setError("");
    try {
      setResult(tab === "standard" ? calculateStandard(data) : tab === "partial" ? calculatePartial(data) : calculateInstallment(data));
    } catch(e) {
      setResult(null);
      setError((e as Error).message);
    }
  }
  async function onPrint(){
    if(!result || tab === "indices" || printing)return;
    const currentResult = result;
    setPrinting(true);
    try{
      await document.fonts.ready;
      if(resultRef.current !== currentResult){setToast("ورودی‌ها تغییر کرده‌اند؛ ابتدا دوباره محاسبه کنید.");return;}
      if(desktop?.printCalculation){
        const outcome = await desktop.printCalculation();
        if(!outcome.success)setToast(/cancel/i.test(outcome.error ?? "") ? "چاپ لغو شد." : `خطا در چاپ: ${outcome.error || "چاپگر در دسترس نیست."}`);
      }else window.print();
    }catch(e){setToast(`خطا در چاپ: ${(e as Error).message}`);}
    finally{setPrinting(false);}
  }
  async function onExcel(){
    if(!result || tab === "indices" || excelBusy)return;
    const currentResult = result;
    setExcelBusy(true);
    try{
      const blob = await buildExcelReport({data,result:currentResult,tab});
      if(resultRef.current !== currentResult){setToast("ورودی‌ها تغییر کرده‌اند؛ ابتدا دوباره محاسبه کنید.");return;}
      const fileName = excelFileName(tab,data);
      if (desktop?.writeFileBase64) {
        const path = await desktop.showSaveDialog({title:"ذخیرهٔ گزارش اکسل",defaultPath:fileName,filters:[{name:"Excel",extensions:["xlsx"]}]});
        if(!path) return;
        await desktop.writeFileBase64(path, await blobToBase64(blob));
        setToast("فایل اکسل گزارش ذخیره شد.");
      } else {
        downloadExcel(blob,fileName);
        setToast("فایل اکسل گزارش دانلود شد.");
      }
    }catch(e){setToast(`خطا در خروجی اکسل: ${(e as Error).message}`);}
    finally{setExcelBusy(false);}
  }
  const meta = tabs.find(t=>t.id===tab)!;
  const coverage = [...data.indices].map(r=>r.month).sort();
  if (!ready || !workspace) return <div className="boot-screen"><Activity size={34}/>در حال بارگذاری داده‌ها...</div>;

  return <div className="app-shell" dir="rtl"><aside className="sidebar"><div className="brand"><div className="brand-mark"><Scale size={24}/></div><div><strong>دادسنج</strong><span>محاسبه‌گر خسارت تأخیر</span></div></div><div className="nav-caption">فضای کار <span>WORKSPACE</span></div><nav className="nav-list">{tabs.map(item=><button key={item.id} className={`nav-item ${tab===item.id?"active":""}`} onClick={()=>{setTab(item.id);resetResult();}}><item.icon size={19}/><span>{item.label}</span><small>{item.number}</small></button>)}</nav><div className="sidebar-bottom"><div className="mini-orb"><ShieldCheck size={18}/></div><strong>محاسبات قابل بررسی</strong><p>از ورودی تا خروجی، هر مرحله با شاخص مرتبط نمایش داده می‌شود.</p><div className="sidebar-divider"/><span className="version">VERSION {__APP_VERSION__} <span>·</span> LOCAL-FIRST</span></div></aside>
  <main className="main-area"><div className="topbar"><div className="breadcrumb">ابزارها <ChevronLeft size={13}/> محاسبه خسارت <ChevronLeft size={13}/> <strong>{meta.label}</strong></div><div className="top-actions"><span className="save-indicator"><span/>{saveState}</span><div className="divider"/><button onClick={onRestoreBackup} className="top-button" title="بازیابی آخرین نسخهٔ پشتیبان"><History size={16}/> بازیابی پشتیبان</button><button onClick={onImport} className="top-button"><Upload size={16}/> ورود INI</button><button onClick={onExport} className="top-button prominent"><Download size={16}/> خروجی INI</button></div></div>
    <CaseBar cases={workspace.cases} activeId={workspace.activeId} onSelect={switchCase} onAdd={addNewCase} onDuplicate={copyCase} onDelete={removeCase} onRename={renameCase}/>
    <div className="content"><div className="hero"><div className="eyebrow"><span className="eyebrow-line"/> ابزار محاسبات حقوقی <span className="eyebrow-en">/ LEGAL CALCULATOR</span></div><h1>{tab === "standard" ? "محاسبه خسارت تأخیر تأدیه" : tab === "partial" ? "پرداخت‌های میانی، دقیق و شفاف" : tab === "installment" ? "تقسیط محکوم‌به در حکم اعسار" : "داده‌های شاخص، در اختیار شما"}</h1><p>{tab === "standard" ? "اصل دین و تاریخ‌ها را وارد کنید تا مبلغ به‌روزشده بر اساس شاخص ماهانه محاسبه شود." : tab === "partial" ? "هر پرداخت در تاریخ خودش به‌روزرسانی می‌شود و از مانده همان مرحله کسر خواهد شد." : tab === "installment" ? "خسارت تا تاریخ حکم اعسار محاسبه و جدا از اصل، میان اقساط تخصیص داده می‌شود." : "شاخص‌های ماهانه را ثبت، ویرایش یا از فایل INI وارد کنید. هیچ نرخ تخمینی استفاده نمی‌شود."}</p><div className="hero-meta"><span><CalendarDays size={14}/> تقویم جلالی</span><span><ReceiptText size={14}/> واحد: ریال ایران</span><span><Database size={14}/> {coverage.length ? `پوشش شاخص: ${coverage[0]} تا ${coverage.at(-1)}` : "شاخصی بارگذاری نشده"}</span></div></div>
    {tab === "indices" ? <IndexManager data={data} setData={setData}/> : <><div className="workspace"><div className="form-column"><div className="panel form-panel"><CardHeading n="INPUT / 01" title={tab === "installment" ? "مشخصات حکم و اعسار" : "مشخصات دین"} subtitle="ورودی‌های خود را به ریال و تاریخ جلالی وارد کنید."/><div className="fields"><Field label={tab === "installment" ? "مبلغ محکوم‌به" : "مبلغ اصل دین"} value={data[tab].principal} onChange={v=>update(tab,"principal",v)} placeholder="مثال: ۵۰۰٬۰۰۰٬۰۰۰" suffix="ریال" wide/><DateField label="تاریخ شروع محاسبه" value={data[tab].start} onChange={v=>update(tab,"start",v)} /><DateField label={tab === "installment" ? "تاریخ صدور حکم اعسار" : "تاریخ پایان محاسبه"} value={tab === "installment" ? data.installment.ruling : data[tab].end} onChange={v=>update(tab,tab === "installment" ? "ruling":"end",v)} /></div><CoverageNote data={data} tab={tab}/></div>
    {tab === "partial" && <div className="panel extra-panel"><div className="extra-head"><CardHeading n="INPUT / 02" title="پرداخت‌های دریافت‌شده" subtitle="ترتیب محاسبه بر اساس تاریخ پرداخت خواهد بود."/><button className="outline-button" onClick={()=>setData({...data,partial:{...data.partial,payments:[...data.partial.payments,{id:crypto.randomUUID(),date:"",amount:""}]}})}><Plus size={16}/> افزودن پرداخت</button></div>{data.partial.payments.length ? <div className="payment-list">{data.partial.payments.map((p,i)=><div className="payment-row" key={p.id}><span className="row-number">{String(i+1).padStart(2,"0")}</span><DateField label="تاریخ پرداخت" value={p.date} onChange={v=>setData({...data,partial:{...data.partial,payments:data.partial.payments.map(item=>item.id===p.id?{...item,date:v}:item)}})} /><Field label="مبلغ پرداخت" value={p.amount} onChange={v=>setData({...data,partial:{...data.partial,payments:data.partial.payments.map(item=>item.id===p.id?{...item,amount:v}:item)}})} placeholder="مثال: ۲۰٬۰۰۰٬۰۰۰" suffix="ریال"/><button className="icon-button remove-payment" title="حذف پرداخت" onClick={()=>setData({...data,partial:{...data.partial,payments:data.partial.payments.filter(item=>item.id!==p.id)}})}><Trash2 size={17}/></button></div>)}</div> : <p className="empty-copy">هنوز پرداختی ثبت نشده است؛ در این حالت نتیجه مانند محاسبه پایه خواهد بود.</p>}<div className="formula-strip" dir="ltr">(index at payment / previous index) × previous balance − payment</div></div>}
    {tab === "installment" && <div className="panel extra-panel"><CardHeading n="INPUT / 02" title="ساختار تقسیط" subtitle="پیش‌پرداخت از اصل مبلغ کم می‌شود؛ خسارت محاسبه‌شده جداگانه بین اقساط تقسیم می‌شود."/><div className="fields"><Field label="پیش‌پرداخت نقدی" value={data.installment.initial} onChange={v=>update("installment","initial",v)} placeholder="مثال: ۵۰٬۰۰۰٬۰۰۰" suffix="ریال" wide/></div><div className="mode-label">روش تعیین اقساط</div><div className="segmented"><button className={data.installment.mode==="count"?"selected":""} onClick={()=>setData({...data,installment:{...data.installment,mode:"count",value:""}})}>تعداد اقساط ثابت</button><button className={data.installment.mode==="amount"?"selected":""} onClick={()=>setData({...data,installment:{...data.installment,mode:"amount",value:""}})}>مبلغ اصلِ هر قسط ثابت</button></div><div className="fields"><Field label={data.installment.mode==="count"?"تعداد اقساط":"سهم ثابت اصل در هر قسط"} value={data.installment.value} onChange={v=>update("installment","value",v)} placeholder={data.installment.mode==="count"?"مثال: ۱۲":"مثال: ۳۰٬۰۰۰٬۰۰۰"} suffix={data.installment.mode==="count"?"قسط":"ریال"} wide/></div><p className="fine-print">در روش مبلغ ثابت، آخرین قسط می‌تواند کمتر باشد. خسارت به نسبت مساوی و به ریال کامل بین اقساط توزیع می‌شود.</p></div>}
    {tab === "installment" && <LateInstallmentCard data={data}/>}
    <div className="form-footer"><button className="primary-button calculate" onClick={run}>محاسبه خسارت <ArrowLeft size={18}/></button><button className="outline-button print-calculation" onClick={onPrint} disabled={!result || printing} title={result ? "چاپ گزارش A4 همراه با ریز محاسبات" : "ابتدا محاسبهٔ معتبر انجام دهید"}><Printer size={17}/>{printing ? "در حال چاپ..." : "چاپ محاسبات"}</button><button className="outline-button print-calculation" onClick={onExcel} disabled={!result || excelBusy} title={result ? "ذخیرهٔ گزارش و ریز محاسبات در فایل اکسل" : "ابتدا محاسبهٔ معتبر انجام دهید"}><Download size={17}/>{excelBusy ? "در حال ساخت..." : "خروجی اکسل"}</button><button className="quiet-button" onClick={()=>{setResult(null);setError("");}}><RotateCcw size={16}/> پاک کردن نتیجه</button></div></div>
    <ResultPanel result={result} error={error} tab={tab} onIndices={()=>setTab("indices")}/></div>{result && <Breakdown result={result} tab={tab}/>}</>}
    <footer className="footer"><span>دادسنج · ابزار محاسباتی مستقل</span><span>نسخهٔ {__APP_VERSION__} · بستهٔ شاخص {DEFAULT_INDICES_REVISION} · ۱۳۷۵ تا ۱۴۰۵ <ArrowUpLeft size={13}/></span></footer></div>
  </main>{tab !== "indices" && <PrintReport data={data} result={result} tab={tab}/>}<input aria-label="انتخاب فایل INI" ref={inputRef} type="file" accept=".ini,text/plain" hidden onChange={async e=>{const file=e.target.files?.[0];if(file) await importText(await file.text());e.target.value="";}}/>{toast && <div className="toast"><FileText size={17}/>{toast}<button onClick={()=>setToast("")}>×</button></div>}</div>;
}

export default Index;
