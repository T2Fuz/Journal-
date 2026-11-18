import { useEffect, useLayoutEffect, useRef, useState } from 'react'
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
      <button onClick={() => setOpen((o) => !o)} aria-label="Section options" className="px-1 text-xs opacity-60 hover:opacity-100">
        ▾
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 min-w-[9rem] rounded-lg border border-line bg-surface text-ink shadow-lg p-1">
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

// Compact, shallow-slanted trapezoid — the shape from the reference screenshot.
const TAB_CLIP = 'polygon(9px 0, calc(100% - 9px) 0, 100% 100%, 0 100%)'
const TAB_H = 34
const OVERLAP = 10
const RESERVED = 76 // room for the "+" button and, if needed, the "⋯" overflow button

function Tab({ s, isActive, onSelect, onRename, onCopy, onDelete, style, innerRef }) {
  return (
    <div
      ref={innerRef}
      style={{ height: TAB_H, ...style }}
      className={`relative shrink-0 transition-transform duration-150 ${isActive ? '-translate-y-px' : ''}`}
    >
      <div
        style={{ clipPath: TAB_CLIP }}
        className={`absolute inset-0 ${SECTION_COLORS[s.color] || SECTION_COLORS.stone} ${
          isActive ? 'opacity-100 shadow-[0_-2px_6px_rgba(0,0,0,0.18)]' : 'opacity-60 hover:opacity-85'
        }`}
      />
      <div className="relative z-10 flex h-full items-center justify-center gap-0.5 px-4">
        <button onClick={() => onSelect(s.id)} className="text-sm font-semibold whitespace-nowrap leading-none">
          {s.name}
        </button>
        <SectionMenu onRename={onRename} onCopy={onCopy} onDelete={onDelete} />
      </div>
    </div>
  )
}

export default function SectionTabs({ sections, activeId, onSelect, onAdd, onRename, onCopy, onDelete }) {
  const containerRef = useRef(null)
  const measureRefs = useRef([])
  const [visibleIds, setVisibleIds] = useState(() => new Set(sections.map((s) => s.id)))
  const [overflowOpen, setOverflowOpen] = useState(false)
  const overflowRef = useRef(null)

  useLayoutEffect(() => {
    const recalc = () => {
      const containerWidth = containerRef.current?.offsetWidth || 0
      const activeIdx = sections.findIndex((s) => s.id === activeId)
      const widthOf = (i) => (measureRefs.current[i]?.offsetWidth || 0) + OVERLAP

      let used = RESERVED
      const keep = new Set()
      if (activeIdx !== -1) {
        used += widthOf(activeIdx)
        keep.add(sections[activeIdx].id)
      }
      sections.forEach((s, i) => {
        if (i === activeIdx) return
        const w = widthOf(i)
        if (used + w <= containerWidth) {
          used += w
          keep.add(s.id)
        }
      })
      setVisibleIds(keep)
    }
    recalc()
    const ro = new ResizeObserver(recalc)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [sections, activeId])

  useEffect(() => {
    if (!overflowOpen) return
    const close = (e) => {
      if (overflowRef.current && !overflowRef.current.contains(e.target)) setOverflowOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [overflowOpen])

  const visible = sections.filter((s) => visibleIds.has(s.id))
  const hidden = sections.filter((s) => !visibleIds.has(s.id))

  return (
    <div ref={containerRef} className="flex items-end min-w-0 flex-1 overflow-hidden" aria-label="Sections">
      {/* Invisible measuring row — same markup, natural width, never shown. */}
      <div className="absolute -z-10 opacity-0 pointer-events-none flex" aria-hidden="true">
        {sections.map((s, i) => (
          <div
            key={s.id}
            ref={(el) => (measureRefs.current[i] = el)}
            className="shrink-0 flex items-center gap-0.5 px-4 text-sm font-semibold whitespace-nowrap"
            style={{ height: TAB_H }}
          >
            {s.name}
            <span className="px-1 text-xs">▾</span>
          </div>
        ))}
      </div>

      <div className="flex items-end" style={{ marginLeft: -OVERLAP }}>
        {visible.map((s) => (
          <Tab
            key={s.id}
            s={s}
            isActive={activeId === s.id}
            onSelect={onSelect}
            onRename={() => onRename(s)}
            onCopy={() => onCopy(s)}
            onDelete={() => onDelete(s)}
            style={{ marginLeft: OVERLAP, zIndex: activeId === s.id ? 50 : 1 }}
          />
        ))}
      </div>

      {hidden.length > 0 && (
        <div ref={overflowRef} className="relative ml-2 mb-0.5 shrink-0">
          <button
            onClick={() => setOverflowOpen((o) => !o)}
            aria-label="More sections"
            className="px-2.5 py-1.5 rounded-lg border border-line text-muted hover:text-ink hover:border-ink/30"
          >
            ⋯
          </button>
          {overflowOpen && (
            <div className="absolute left-0 top-full mt-1 z-50 min-w-[11rem] rounded-lg border border-line bg-surface text-ink shadow-lg p-1">
              {hidden.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setOverflowOpen(false)
                    onSelect(s.id)
                  }}
                  className="flex w-full items-center gap-2 text-left px-3 py-1.5 rounded-md text-sm hover:bg-line"
                >
                  <span className={`inline-block h-2.5 w-2.5 rounded-full ${SECTION_COLORS[s.color] || SECTION_COLORS.stone}`} />
                  {s.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <button
        onClick={onAdd}
        aria-label="Add section"
        className="ml-2 mb-0.5 shrink-0 px-3 py-1.5 rounded-lg border border-dashed border-stone-300 text-stone-400 hover:text-stone-600 hover:border-stone-400"
      >
        +
      </button>
    </div>
  )
}
