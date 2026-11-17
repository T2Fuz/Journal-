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
    <nav className="flex items-end flex-wrap" aria-label="Sections">
      {sections.map((s, i) => {
        const isActive = activeId === s.id
        return (
          <div
            key={s.id}
            style={{ zIndex: isActive ? sections.length + 1 : sections.length - i }}
            className={`relative flex items-stretch rounded-t-xl overflow-hidden -mr-1.5 transition-all duration-150 ${
              SECTION_COLORS[s.color] || SECTION_COLORS.stone
            } ${
              isActive
                ? 'shadow-[0_-3px_10px_rgba(0,0,0,0.15)] -translate-y-0.5 opacity-100'
                : 'opacity-65 hover:opacity-90'
            }`}
          >
            <button onClick={() => onSelect(s.id)} className="px-5 py-2.5 text-sm font-semibold whitespace-nowrap">
              {s.name}
            </button>
            <SectionMenu onRename={() => onRename(s)} onCopy={() => onCopy(s)} onDelete={() => onDelete(s)} />
          </div>
        )
      })}
      <button
        onClick={onAdd}
        aria-label="Add section"
        className="ml-2 mb-0.5 px-3.5 py-2 rounded-lg border border-dashed border-stone-300 text-stone-400 hover:text-stone-600 hover:border-stone-400"
      >
        +
      </button>
    </nav>
  )
}
