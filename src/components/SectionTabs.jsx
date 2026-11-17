import { useEffect, useRef, useState } from 'react'
import { SECTION_COLORS } from '../colors.js'

function SectionMenu({ onRename, onCopy, onDelete }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Section options"
        className="px-1.5 h-full text-xs opacity-60 hover:opacity-100"
      >
        ▾
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-30 min-w-[9rem] rounded-lg border border-line bg-surface text-ink shadow-lg p-1">
          <button
            className="block w-full text-left px-3 py-1.5 rounded-md text-sm hover:bg-line"
            onClick={() => {
              setOpen(false)
              onRename()
            }}
          >
            Rename
          </button>
          <button
            className="block w-full text-left px-3 py-1.5 rounded-md text-sm hover:bg-line"
            onClick={() => {
              setOpen(false)
              onCopy()
            }}
          >
            Copy
          </button>
          <button
            className="block w-full text-left px-3 py-1.5 rounded-md text-sm hover:bg-line text-red-600"
            onClick={() => {
              setOpen(false)
              onDelete()
            }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  )
}

export default function SectionTabs({ sections, activeId, onSelect, onAdd, onRename, onCopy, onDelete }) {
  return (
    <nav className="flex gap-1 flex-wrap items-end" aria-label="Sections">
      {sections.map((s) => {
        const active = activeId === s.id
        return (
          <div
            key={s.id}
            className={`flex items-stretch rounded-t-xl transition-all ${
              SECTION_COLORS[s.color] || SECTION_COLORS.stone
            } ${active ? 'z-10 -mb-px shadow-[0_-4px_10px_rgba(0,0,0,0.2)]' : 'opacity-75 translate-y-0.5'}`}
          >
            <button onClick={() => onSelect(s.id)} className="px-4 py-2 text-sm font-semibold">
              {s.name}
            </button>
            <SectionMenu onRename={() => onRename(s)} onCopy={() => onCopy(s)} onDelete={() => onDelete(s)} />
          </div>
        )
      })}
      <button
        onClick={onAdd}
        aria-label="Add section"
        className="px-3.5 py-2 mb-0.5 rounded-t-xl border border-dashed border-stone-300 text-stone-400"
      >
        +
      </button>
    </nav>
  )
}
