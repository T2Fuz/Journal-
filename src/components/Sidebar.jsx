import { useEffect, useRef, useState } from 'react'
import { deriveTitle } from '../titleUtils.js'
import { SortButton } from './SortSearch.jsx'

function ItemMenu({ onRename, onCopy, onDelete }) {
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
        aria-label="Page options"
        className="w-6 h-6 rounded hover:bg-line flex items-center justify-center text-muted shrink-0"
      >
        ⋮
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-30 min-w-[9rem] rounded-lg border border-line bg-surface text-ink shadow-lg p-1">
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

export default function Sidebar({
  pages,
  activeId,
  onSelect,
  onAdd,
  onRename,
  onCopy,
  onDelete,
  trashCount,
  onOpenTrash,
  sortMode,
  onSortChange,
}) {
  return (
    <aside className="w-64 shrink-0 border-l border-line p-4 flex flex-col">
      <div className="mb-4 flex gap-2">
        <button
          onClick={onAdd}
          className="min-w-0 flex-1 bg-pink-800 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-pink-700"
        >
          + Add Page
        </button>
        <SortButton mode={sortMode} onChange={onSortChange} />
      </div>
      <ul className="space-y-1 flex-1 overflow-y-auto">
        {pages.map((p) => (
          <li key={p.id} className="flex items-center gap-1">
            <button
              onClick={() => onSelect(p.id)}
              className={`flex-1 min-w-0 text-left px-2.5 py-2 rounded-md text-sm truncate ${
                activeId === p.id
                  ? 'bg-pink-200 text-pink-900 font-bold dark:bg-pink-900/60 dark:text-pink-100'
                  : 'text-ink hover:bg-line'
              }`}
            >
              {p.title || deriveTitle(p.content)}
            </button>
            <ItemMenu onRename={() => onRename(p)} onCopy={() => onCopy(p)} onDelete={() => onDelete(p)} />
          </li>
        ))}
      </ul>
      <button onClick={onOpenTrash} className="mt-3 text-xs text-muted underline text-left">
        🗑 Recycle Bin{trashCount ? ` (${trashCount})` : ''}
      </button>
    </aside>
  )
}
