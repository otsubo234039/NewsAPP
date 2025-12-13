import React, { useEffect, useRef, useState } from 'react';

type Option = { value: string; label: string };
type Group = { label: string; options: Option[] };

type Props = {
  groups: Group[];
  selected: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  maxVisible?: number;
};

export default function TagDropdown({ groups, selected, onChange, placeholder = 'タグを選択', maxVisible = 3 }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const toggle = () => setOpen(o => !o);

  const onToggleOption = (e: React.ChangeEvent<HTMLInputElement>, value: string) => {
    e.stopPropagation();
    const next = selected.includes(value) ? selected.filter(s => s !== value) : [...selected, value];
    onChange(next);
  };

  const selectedLabels: string[] = [];
  groups.forEach(g => g.options.forEach(o => { if (selected.includes(o.value)) selectedLabels.push(o.label); }));

  const summary = selectedLabels.length === 0 ? placeholder : (selectedLabels.length <= maxVisible ? selectedLabels.join(', ') : `${selectedLabels.slice(0, maxVisible).join(', ')} 他 ${selectedLabels.length - maxVisible} 件`);

  return (
    <div className="tag-dropdown" ref={rootRef} style={{ position: 'relative' }}>
      <button type="button" className="tag-dropdown-button" onClick={toggle} aria-haspopup="true" aria-expanded={open}>
        <span style={{ marginRight: 8 }}>{summary}</span>
        <span style={{ opacity: 0.7 }}>▾</span>
      </button>
      {open ? (
        <div className="tag-dropdown-panel" role="dialog" aria-label="タグ選択" style={{ position: 'absolute', right: 0, zIndex: 2000, minWidth: 260, maxHeight: 320, overflow: 'auto', background: 'var(--card-bg-light)', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 8, padding: 10, boxShadow: '0 8px 30px rgba(2,8,23,0.6)' }}>
          {groups.map((g, gi) => (
            <div key={gi} className="tag-group">
              <div className="tag-group-label">{g.label}</div>
              <div className="tag-options">
                {g.options.map(o => (
                  <label key={o.value} className="tag-option" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={selected.includes(o.value)} onChange={(e) => onToggleOption(e, o.value)} />
                    <span>{o.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
