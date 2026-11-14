import { useEffect, useState } from "react";
import { Copy, FolderOpen, Pencil, Plus, Trash2 } from "lucide-react";
import type { CaseRecord } from "../lib/workspace";

export function CaseBar({
  cases,
  activeId,
  onSelect,
  onAdd,
  onDuplicate,
  onDelete,
  onRename,
}: {
  cases: CaseRecord[];
  activeId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onRename: (name: string) => void;
}) {
  const active = cases.find((item) => item.id === activeId) ?? cases[0];
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(active.name);

  useEffect(() => {
    setEditing(false);
    setName(active.name);
  }, [active.id, active.name]);

  function commit() {
    const clean = name.trim();
    if (clean && clean !== active.name) onRename(clean);
    setEditing(false);
  }

  return (
    <div className="case-bar" dir="rtl">
      <span className="case-bar-label"><FolderOpen size={15} /> پرونده فعال</span>
      {editing ? (
        <input
          autoFocus
          className="case-name-input"
          aria-label="نام پرونده"
          value={name}
          maxLength={80}
          onChange={(event) => setName(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") commit();
            if (event.key === "Escape") { setName(active.name); setEditing(false); }
          }}
        />
      ) : (
        <button type="button" className="case-name" onClick={() => setEditing(true)} title="تغییر نام پرونده">
          {active.name} <Pencil size={13} />
        </button>
      )}
      <select
        className="case-select"
        aria-label="انتخاب پرونده"
        value={activeId}
        onChange={(event) => onSelect(event.target.value)}
      >
        {cases.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select>
      <small className="case-count">{cases.length} پرونده</small>
      <div className="case-actions">
        <button type="button" onClick={onAdd} title="پرونده جدید"><Plus size={16} /></button>
        <button type="button" onClick={onDuplicate} title="تکثیر پرونده"><Copy size={15} /></button>
        <button
          type="button"
          onClick={onDelete}
          disabled={cases.length <= 1}
          title={cases.length <= 1 ? "آخرین پرونده حذف نمی‌شود" : "حذف پرونده"}
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}
