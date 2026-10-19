import { useEffect, useRef, useState } from "react";
import { Activity, ArrowLeft, ArrowUpLeft, BookOpen, CalendarDays, ChevronLeft, CircleHelp, Database, Download, FileClock, FileText, Layers3, Plus, ReceiptText, RotateCcw, Scale, ShieldCheck, Sparkles, Trash2, Upload } from "lucide-react";
import { useDesktop } from "../hooks/use-desktop";
import { calculateInstallment, calculatePartial, calculateStandard, digits, emptyData, indexText, money, parseMonth, type AppData, type Result } from "../lib/calculator";
import { fromIni, toIni } from "../lib/ini";

type Tab = "standard" | "partial" | "installment" | "indices";
const tabs = [
  { id: "standard" as const, label: "محاسبه خسارت", short: "محاسبه پایه", icon: FileClock, number: "01" },
  { id: "partial" as const, label: "پرداخت‌های میانی", short: "چند پرداختی", icon: Layers3, number: "02" },
  { id: "installment" as const, label: "اقساط اعسار", short: "حکم تقسیط", icon: Scale, number: "03" },
  { id: "indices" as const, label: "مدیریت شاخص‌ها", short: "داده‌های شاخص", icon: Database, number: "04" },
];
const blurDate = "مثال: ۱۴۰۳/۰۱/۱۵";
function Field({ label, value, onChange, placeholder, help, suffix, wide }: { label: string; value: string; onChange: (v:string)=>void; placeholder?: string; help?: string; suffix?: string; wide?: boolean }) {
  return <label className={`field ${wide ? "field-wide" : ""}`}><span className="field-label">{label}</span><span className="input-wrap"><input aria-label={label} dir="ltr" inputMode="decimal" value={value} placeholder={placeholder} onChange={e=>onChange(e.target.value)} /><span className="input-suffix">{suffix}</span></span>{help && <small>{help}</small>}</label>;
}
function CardHeading({ n, title, subtitle }: { n: string; title: string; subtitle?: string }) {
  return <div className="card-heading"><span className="section-count">{n}</span><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div></div>;
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
    <div className="panel index-panel"><CardHeading n="DATA / 01" title="آرشیو شاخص‌های ماهانه" subtitle="مقادیر شاخص را دقیقاً مطابق منبع رسمی خود وارد کنید." />
      <div className="table-toolbar"><span className="soft-label">{money(rows.length)} ماه ثبت‌شده</span><span className="soft-label">مرتب‌سازی: جدیدترین ابتدا</span></div>
      <div className="table-scroll"><table className="data-table"><thead><tr><th>ماه جلالی</th><th>مقدار شاخص</th><th>وضعیت</th><th>عملیات</th></tr></thead><tbody>{rows.length ? rows.map(row => {
        const original = data.indices.indexOf(row);
        return <tr key={original}><td><input aria-label={`ماه شاخص ${row.month}`} className="table-input month-cell" dir="ltr" value={row.month} onChange={e=>setData({...data,indices:data.indices.map((r,i)=>i===original?{...r,month:e.target.value}:r)})} /></td><td><input aria-label={`مقدار شاخص ${row.month}`} className="table-input" dir="ltr" inputMode="decimal" value={row.value} onChange={e=>setData({...data,indices:data.indices.map((r,i)=>i===original?{...r,value:e.target.value}:r)})} /></td><td><span className="tiny-status"><span /> ثبت دستی</span></td><td><button aria-label={`حذف شاخص ${row.month}`} className="icon-button" title="حذف شاخص" onClick={()=>setData({...data,indices:data.indices.filter((_,i)=>i!==original)})}><Trash2 size={16}/></button></td></tr>;
      }) : null}</tbody></table>{!rows.length && <div className="table-empty"><Database size={28}/><strong>هنوز شاخصی ثبت نشده است</strong><span>فایل INI را وارد کنید یا اولین ماه را در بخش روبه‌رو اضافه کنید.</span></div>}</div>
    </div>
    <div className="side-stack"><div className="panel small-panel"><CardHeading n="DATA / 02" title="افزودن شاخص" subtitle="هر ماه یک مقدار شاخص دارد." /><div className="fields one"><Field label="ماه جلالی" value={month} onChange={setMonth} placeholder="۱۴۰۳/۰۱" suffix={<CalendarDays size={16}/>} /><Field label="عدد شاخص" value={value} onChange={setValue} placeholder="مثال: ۳۵۰٫۲" /></div>{message && <p className="error-text">{message}</p>}<button className="primary-button full" onClick={add}><Plus size={17}/> افزودن به آرشیو</button></div>
    <div className="info-panel"><ShieldCheck size={20}/><strong>داده‌ها تحت کنترل شماست</strong><p>هیچ شاخص رسمی از پیش در برنامه قرار نگرفته است. داده‌های واردشده در نسخهٔ دسکتاپ به صورت خودکار در فایل INI روی دستگاه ذخیره می‌شوند.</p></div></div>
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
  </div><div className="note-panel"><BookOpen size={18}/><p>مبنای محاسبه، نسبت شاخص ماه پایان به ماه شروع است. مقادیر شاخص باید توسط شما از منبع معتبر ثبت شوند. این ابزار جایگزین بررسی حقوقی پرونده نیست.</p></div></div>;
}

function Breakdown({ result, tab }: {result:Result; tab:Tab}) {
  return <div className="panel breakdown"><CardHeading n="DETAIL / 02" title={tab === "installment" ? "برنامه پرداخت اقساط" : "ریز محاسبات"} subtitle={tab === "installment" ? "پیش‌پرداخت فقط از اصل مبلغ کسر شده؛ خسارت جداگانه بین اقساط تقسیم شده است." : "گرد کردن تنها در خروجی نهایی انجام می‌شود؛ مراحل با دقت کامل محاسبه شده‌اند."}/>
    {tab === "installment" && result.plan ? <div className="table-scroll"><table className="data-table"><thead><tr><th>مرحله</th><th>سهم اصل</th><th>سهم خسارت</th><th>مبلغ پرداخت</th></tr></thead><tbody>{result.plan.map(row=><tr key={row.number}><td>{row.number === 0 ? "پیش‌پرداخت نقدی" : `قسط ${money(row.number)}`}</td><td dir="ltr">{money(row.principal)}</td><td dir="ltr">{money(row.damages)}</td><td className="bright" dir="ltr">{money(row.total)}</td></tr>)}</tbody><tfoot><tr><td>مجموع</td><td dir="ltr">{money(result.principal)}</td><td dir="ltr">{money(result.damages)}</td><td dir="ltr">{money(result.total)}</td></tr></tfoot></table></div> : <div className="table-scroll"><table className="data-table"><thead><tr><th>مرحله</th><th>تاریخ</th><th>شاخص</th><th>مانده پیش از پرداخت</th><th>پرداخت</th><th>مانده پس از پرداخت</th></tr></thead><tbody>{result.stages.map((s,i)=><tr key={i}><td>{s.label}</td><td dir="ltr">{s.date}</td><td dir="ltr">{indexText(s.index)}</td><td dir="ltr">{money(s.before)}</td><td dir="ltr">{money(s.payment)}</td><td className="bright" dir="ltr">{money(s.after)}</td></tr>)}</tbody></table></div>}
    {tab === "partial" && <p className="audit-foot">کنترل حسابداری: ماندهٔ پایان + پرداخت‌های میانی − اصل دین = {money(result.damages)} ریال خسارت محاسبه‌شده (در صورت عدم کاهش شاخص).</p>}
  </div>;
}

function Index() {
  const desktop = useDesktop();
  const inputRef = useRef<HTMLInputElement>(null);
  const [tab,setTab] = useState<Tab>("standard");
  const [data,setDataRaw] = useState<AppData>(emptyData);
  const [ready,setReady] = useState(false);
  const [saveState,setSaveState] = useState("در حال بارگذاری");
  const [toast,setToast] = useState("");
  const [result,setResult] = useState<Result|null>(null);
  const [error,setError] = useState("");
  const setData = (next:AppData) => {setDataRaw(next);setResult(null);setError("");};
  useEffect(()=>{ let active=true; (async()=>{try { const stored=desktop ? await desktop.readDataIni() : localStorage.getItem("damages-data-ini"); if(active && stored) setDataRaw(fromIni(stored)); if(active) setSaveState("داده‌ها آماده‌اند"); } catch(e) {if(active) setSaveState(`خطا در بارگذاری: ${(e as Error).message}`);} finally {if(active) setReady(true);} })(); return()=>{active=false;}; },[desktop]);
  useEffect(()=>{if(!ready)return; setSaveState("در حال ذخیره..."); const timer=setTimeout(async()=>{try{const content=toIni(data); if(desktop) await desktop.writeDataIni(content); else localStorage.setItem("damages-data-ini",content);setSaveState("ذخیره‌شده در فایل INI");}catch(e){setSaveState(`خطا در ذخیره: ${(e as Error).message}`);}},350);return()=>clearTimeout(timer);},[data,ready,desktop]);
  useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(""),4200);return()=>clearTimeout(t);},[toast]);
  async function importText(content:string){try{const imported=fromIni(content);setData(imported);setTab("indices");setToast(`${money(imported.indices.length)} شاخص از فایل INI بارگذاری شد.`);}catch(e){setToast(`خطا: ${(e as Error).message}`);}}
  async function onImport(){try{if(desktop){const paths=await desktop.showOpenDialog({title:"انتخاب فایل شاخص و داده‌ها",filters:[{name:"INI",extensions:["ini"]}],properties:["openFile"]});if(paths[0])await importText(await desktop.readFile(paths[0]));}else inputRef.current?.click();}catch(e){setToast(`خطا در خواندن فایل: ${(e as Error).message}`);}}
  async function onExport(){try{const text=toIni(data);if(desktop){const path=await desktop.showSaveDialog({title:"ذخیره داده‌ها به صورت INI",defaultPath:"damages-data.ini",filters:[{name:"INI",extensions:["ini"]}]});if(path){await desktop.writeFile(path,text);setToast("فایل INI ذخیره شد.");}}else{const url=URL.createObjectURL(new Blob([text],{type:"text/plain;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download="damages-data.ini";a.click();URL.revokeObjectURL(url);setToast("فایل INI دانلود شد.");}}catch(e){setToast(`خطا در ذخیره فایل: ${(e as Error).message}`);}}
  const update = (section:"standard"|"partial"|"installment", key:string, val:string) => setData({...data,[section]:{...data[section],[key]:val}});
  function run(){setError("");try{setResult(tab === "standard" ? calculateStandard(data) : tab === "partial" ? calculatePartial(data) : calculateInstallment(data));}catch(e){setResult(null);setError((e as Error).message);}}
  const meta = tabs.find(t=>t.id===tab)!;
  const coverage = [...data.indices].map(r=>r.month).sort();
  if (!ready) return <div className="boot-screen"><Activity size={34}/>در حال بارگذاری داده‌ها...</div>;
  return <div className="app-shell" dir="rtl"><aside className="sidebar"><div className="brand"><div className="brand-mark"><Scale size={24}/></div><div><strong>دادسنج</strong><span>محاسبه‌گر خسارت تأخیر</span></div></div><div className="nav-caption">فضای کار <span>WORKSPACE</span></div><nav className="nav-list">{tabs.map(item=><button key={item.id} className={`nav-item ${tab===item.id?"active":""}`} onClick={()=>{setTab(item.id);setResult(null);setError("");}}><item.icon size={19}/><span>{item.label}</span><small>{item.number}</small></button>)}</nav><div className="sidebar-bottom"><div className="mini-orb"><ShieldCheck size={18}/></div><strong>محاسبات قابل بررسی</strong><p>از ورودی تا خروجی، هر مرحله با شاخص مرتبط نمایش داده می‌شود.</p><div className="sidebar-divider"/><span className="version">VERSION 1.0 <span>·</span> LOCAL-FIRST</span></div></aside>
  <main className="main-area"><div className="topbar"><div className="breadcrumb">ابزارها <ChevronLeft size={13}/> محاسبه خسارت <ChevronLeft size={13}/> <strong>{meta.label}</strong></div><div className="top-actions"><span className="save-indicator"><span/>{saveState}</span><div className="divider"/><button onClick={onImport} className="top-button"><Upload size={16}/> ورود INI</button><button onClick={onExport} className="top-button prominent"><Download size={16}/> خروجی INI</button></div></div>
    <div className="content"><div className="hero"><div className="eyebrow"><span className="eyebrow-line"/> ابزار محاسبات حقوقی <span className="eyebrow-en">/ LEGAL CALCULATOR</span></div><h1>{tab === "standard" ? "محاسبه خسارت تأخیر تأدیه" : tab === "partial" ? "پرداخت‌های میانی، دقیق و شفاف" : tab === "installment" ? "تقسیط محکوم‌به در حکم اعسار" : "داده‌های شاخص، در اختیار شما"}</h1><p>{tab === "standard" ? "اصل دین و تاریخ‌ها را وارد کنید تا مبلغ به‌روزشده بر اساس شاخص ماهانه محاسبه شود." : tab === "partial" ? "هر پرداخت در تاریخ خودش به‌روزرسانی می‌شود و از مانده همان مرحله کسر خواهد شد." : tab === "installment" ? "خسارت تا تاریخ حکم اعسار محاسبه و جدا از اصل، میان اقساط تخصیص داده می‌شود." : "شاخص‌های ماهانه را ثبت، ویرایش یا از فایل INI وارد کنید. هیچ نرخ تخمینی استفاده نمی‌شود."}</p><div className="hero-meta"><span><CalendarDays size={14}/> تقویم جلالی</span><span><ReceiptText size={14}/> واحد: ریال ایران</span><span><Database size={14}/> {coverage.length ? `پوشش شاخص: ${coverage[0]} تا ${coverage.at(-1)}` : "شاخصی بارگذاری نشده"}</span></div></div>
    {tab === "indices" ? <IndexManager data={data} setData={setData}/> : <><div className="workspace"><div className="form-column"><div className="panel form-panel"><CardHeading n="INPUT / 01" title={tab === "installment" ? "مشخصات حکم و اعسار" : "مشخصات دین"} subtitle="ورودی‌های خود را به ریال و تاریخ جلالی وارد کنید."/><div className="fields"><Field label={tab === "installment" ? "مبلغ محکوم‌به" : "مبلغ اصل دین"} value={data[tab].principal} onChange={v=>update(tab,"principal",v)} placeholder="مثال: ۵۰۰٬۰۰۰٬۰۰۰" suffix="ریال" wide/><Field label="تاریخ شروع محاسبه" value={data[tab].start} onChange={v=>update(tab,"start",v)} placeholder={blurDate} suffix={<CalendarDays size={16}/>} /><Field label={tab === "installment" ? "تاریخ صدور حکم اعسار" : "تاریخ پایان محاسبه"} value={tab === "installment" ? data.installment.ruling : data[tab].end} onChange={v=>update(tab,tab === "installment" ? "ruling":"end",v)} placeholder={blurDate} suffix={<CalendarDays size={16}/>} /></div></div>
    {tab === "partial" && <div className="panel extra-panel"><div className="extra-head"><CardHeading n="INPUT / 02" title="پرداخت‌های دریافت‌شده" subtitle="ترتیب محاسبه بر اساس تاریخ پرداخت خواهد بود."/><button className="outline-button" onClick={()=>setData({...data,partial:{...data.partial,payments:[...data.partial.payments,{id:crypto.randomUUID(),date:"",amount:""}]}})}><Plus size={16}/> افزودن پرداخت</button></div>{data.partial.payments.length ? <div className="payment-list">{data.partial.payments.map((p,i)=><div className="payment-row" key={p.id}><span className="row-number">{String(i+1).padStart(2,"0")}</span><Field label="تاریخ پرداخت" value={p.date} onChange={v=>setData({...data,partial:{...data.partial,payments:data.partial.payments.map(item=>item.id===p.id?{...item,date:v}:item)}})} placeholder={blurDate}/><Field label="مبلغ پرداخت" value={p.amount} onChange={v=>setData({...data,partial:{...data.partial,payments:data.partial.payments.map(item=>item.id===p.id?{...item,amount:v}:item)}})} placeholder="مثال: ۲۰٬۰۰۰٬۰۰۰" suffix="ریال"/><button className="icon-button remove-payment" title="حذف پرداخت" onClick={()=>setData({...data,partial:{...data.partial,payments:data.partial.payments.filter(item=>item.id!==p.id)}})}><Trash2 size={17}/></button></div>)}</div> : <p className="empty-copy">هنوز پرداختی ثبت نشده است؛ در این حالت نتیجه مانند محاسبه پایه خواهد بود.</p>}<div className="formula-strip" dir="ltr">(index at payment / previous index) × previous balance − payment</div></div>}
    {tab === "installment" && <div className="panel extra-panel"><CardHeading n="INPUT / 02" title="ساختار تقسیط" subtitle="پیش‌پرداخت از اصل مبلغ کم می‌شود؛ خسارت محاسبه‌شده جداگانه بین اقساط تقسیم می‌شود."/><div className="fields"><Field label="پیش‌پرداخت نقدی" value={data.installment.initial} onChange={v=>update("installment","initial",v)} placeholder="مثال: ۵۰٬۰۰۰٬۰۰۰" suffix="ریال" wide/></div><div className="mode-label">روش تعیین اقساط</div><div className="segmented"><button className={data.installment.mode==="count"?"selected":""} onClick={()=>setData({...data,installment:{...data.installment,mode:"count",value:""}})}>تعداد اقساط ثابت</button><button className={data.installment.mode==="amount"?"selected":""} onClick={()=>setData({...data,installment:{...data.installment,mode:"amount",value:""}})}>مبلغ اصلِ هر قسط ثابت</button></div><div className="fields"><Field label={data.installment.mode==="count"?"تعداد اقساط":"سهم ثابت اصل در هر قسط"} value={data.installment.value} onChange={v=>update("installment","value",v)} placeholder={data.installment.mode==="count"?"مثال: ۱۲":"مثال: ۳۰٬۰۰۰٬۰۰۰"} suffix={data.installment.mode==="count"?"قسط":"ریال"} wide/></div><p className="fine-print">در روش مبلغ ثابت، آخرین قسط می‌تواند کمتر باشد. خسارت به نسبت مساوی و به ریال کامل بین اقساط توزیع می‌شود.</p></div>}
    <div className="form-footer"><button className="primary-button calculate" onClick={run}>محاسبه خسارت <ArrowLeft size={18}/></button><button className="quiet-button" onClick={()=>{setResult(null);setError("");}}><RotateCcw size={16}/> پاک کردن نتیجه</button></div></div>
    <ResultPanel result={result} error={error} tab={tab} onIndices={()=>setTab("indices")}/></div>{result && <Breakdown result={result} tab={tab}/>}</>}
    <footer className="footer"><span>دادسنج · ابزار محاسباتی مستقل</span><span>داده‌های رسمی را خودتان وارد کنید <ArrowUpLeft size={13}/></span></footer></div>
  </main><input aria-label="انتخاب فایل INI" ref={inputRef} type="file" accept=".ini,text/plain" hidden onChange={async e=>{const file=e.target.files?.[0];if(file) await importText(await file.text());e.target.value="";}}/>{toast && <div className="toast"><FileText size={17}/>{toast}<button onClick={()=>setToast("")}>×</button></div>}</div>;
}

export default Index;
