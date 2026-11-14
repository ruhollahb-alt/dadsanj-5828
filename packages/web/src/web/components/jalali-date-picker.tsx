import { useEffect, useMemo, useRef, useState } from "react";
import { jalaaliMonthLength, toGregorian, toJalaali } from "jalaali-js";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { MONTH_NAMES } from "../lib/cpi";
import { digits } from "../lib/calculator";

const WEEKDAYS = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

type Parts = { jy: number; jm: number; jd: number };

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function parseValue(value: string): Parts | null {
  const normalized = digits(value).replace(/[-.]/g, "/");
  const match = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(normalized);
  if (!match) return null;
  const jy = Number(match[1]);
  const jm = Number(match[2]);
  const jd = Number(match[3]);
  if (jm < 1 || jm > 12 || jd < 1 || jd > jalaaliMonthLength(jy, jm)) return null;
  return { jy, jm, jd };
}

function todayParts(): Parts {
  const now = new Date();
  const j = toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  return { jy: j.jy, jm: j.jm, jd: j.jd };
}

export function JalaliDatePicker({
  value,
  onChange,
  ariaLabel,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  placeholder?: string;
}) {
  const today = useMemo(todayParts, []);
  const rootRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const initial = parseValue(value) ?? today;
  const [view, setView] = useState({ jy: initial.jy, jm: initial.jm });

  useEffect(() => {
    if (!open) return;
    const parsed = parseValue(value) ?? today;
    setView({ jy: parsed.jy, jm: parsed.jm });
  }, [open, value, today]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [open]);

  const selected = parseValue(value);
  const monthLength = jalaaliMonthLength(view.jy, view.jm);
  const firstDay = toGregorian(view.jy, view.jm, 1);
  const weekDay = new Date(firstDay.gy, firstDay.gm - 1, firstDay.gd).getDay();
  const offset = (weekDay + 1) % 7;

  function moveMonth(step: number) {
    const monthIndex = view.jy * 12 + (view.jm - 1) + step;
    setView({ jy: Math.floor(monthIndex / 12), jm: (monthIndex % 12) + 1 });
  }

  function pick(jd: number) {
    onChange(`${view.jy}/${pad(view.jm)}/${pad(jd)}`);
    setOpen(false);
  }

  const cells: (number | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: monthLength }, (_, i) => i + 1),
  ];

  return (
    <span className="input-wrap date-wrap" ref={rootRef} onKeyDown={(event) => {
      if (event.key === "Escape") setOpen(false);
    }}>
      <input
        aria-label={ariaLabel}
        dir="ltr"
        inputMode="decimal"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
      <button
        type="button"
        className="date-toggle"
        aria-label={`باز کردن تقویم ${ariaLabel}`}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <CalendarDays size={16} />
      </button>
      {open && (
        <div className="date-popover" role="dialog" aria-label={`تقویم ${ariaLabel}`}>
          <div className="date-popover-head">
            <button type="button" aria-label="ماه بعد" onClick={() => moveMonth(1)}><ChevronLeft size={16} /></button>
            <strong>{MONTH_NAMES[view.jm - 1]} {view.jy}</strong>
            <button type="button" aria-label="ماه قبل" onClick={() => moveMonth(-1)}><ChevronRight size={16} /></button>
          </div>
          <div className="date-weekdays">
            {WEEKDAYS.map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="date-grid">
            {cells.map((day, index) =>
              day === null ? <span key={`empty-${index}`} /> : (
                <button
                  type="button"
                  key={day}
                  className={selected && selected.jy === view.jy && selected.jm === view.jm && selected.jd === day ? "selected" : ""}
                  aria-label={`${view.jy}/${pad(view.jm)}/${pad(day)}`}
                  aria-pressed={!!selected && selected.jy === view.jy && selected.jm === view.jm && selected.jd === day}
                  onClick={() => pick(day)}
                >
                  {day}
                </button>
              ),
            )}
          </div>
          <div className="date-popover-foot">
            <button type="button" onClick={() => { onChange(`${today.jy}/${pad(today.jm)}/${pad(today.jd)}`); setOpen(false); }}>امروز</button>
            <button type="button" onClick={() => { onChange(""); setOpen(false); }}>پاک کردن</button>
          </div>
        </div>
      )}
    </span>
  );
}
