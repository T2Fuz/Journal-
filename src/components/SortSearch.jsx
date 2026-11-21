import { useEffect, useMemo, useRef, useState } from 'react'
import { SECTION_COLORS } from '../colors.js'
import { deriveTitle, stripHtml } from '../titleUtils.js'
import { IconSearch, IconSort } from './Icons.jsx'

// ───────────── sorting ─────────────
export const SORT_OPTIONS = [
  { key: 'created-asc', label: 'Date created · oldest first' },
  { key: 'created-desc', label: 'Date created · newest first' },
  { key: 'modified-desc', label: 'Last edited · newest first' },
  { key: 'modified-asc', label: 'Last edited · oldest first' },
  { key: 'name-asc', label: 'Name · A → Z' },
  { key: 'name-desc', label: 'Name · Z → A' },
]

const nameOf = (p) => (p.title || deriveTitle(p.content, 8)).trim()
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })

export function sortPages(pages, mode) {
  const list = [...pages]
  const edited = (p) => p.updatedMs ?? p.createdMs
  switch (mode) {
    case 'created-desc':
      return list.sort((a, b) => b.createdMs - a.createdMs)
    case 'modified-desc':
      return list.sort((a, b) => edited(b) - edited(a))
    case 'modified-asc':
      return list.sort((a, b) => edited(a) - edited(b))
    case 'name-asc':
      return list.sort((a, b) => collator.compare(nameOf(a), nameOf(b)))
    case 'name-desc':
      return list.sort((a, b) => collator.compare(nameOf(b), nameOf(a)))
    default:
      return list.sort((a, b) => a.createdMs - b.createdMs)
  }
}

// Desktop: the little button next to "+ Add Page"
export function SortButton({ mode, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Sort pages"
        title="Sort pages"
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-line text-muted hover:bg-line"
      >
        <IconSort size={18} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-40 mt-1 w-60 rounded-lg border border-line bg-surface p-1 text-sm text-ink shadow-lg">
          <p className="px-3 py-1.5 text-[11px] uppercase tracking-wide text-muted">Sort pages by</p>
          {SORT_OPTIONS.map((o) => (
            <button
              key={o.key}
              onClick={() => {
                onChange(o.key)
                setOpen(false)
              }}
              className="flex w-full items-center justify-between rounded-md px-3 py-1.5 text-left hover:bg-line"
            >
              {o.label}
              {mode === o.key && <span className="text-pink-600">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ───────────── search ─────────────
const decode = (s) =>
  s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function Highlight({ text, terms }) {
  if (!terms.length) return text
  const parts = text.split(new RegExp(`(${terms.map(esc).join('|')})`, 'gi'))
  return parts.map((p, i) =>
    i % 2 ? (
      <mark key={i} className="rounded bg-yellow-300/80 px-0.5 text-black">
        {p}
      </mark>
    ) : (
      p
    ),
  )
}

export function SearchButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label="Search"
      title="Search (Ctrl+K)"
      className="flex h-9 w-9 items-center justify-center rounded-full border border-line hover:bg-line"
    >
      <IconSearch size={17} />
    </button>
  )
}

export function SearchModal({ pages, sections, onOpen, onClose }) {
  const [q, setQ] = useState('')

  // read every page once (not on each keystroke)
  const index = useMemo(
    () =>
      pages.map((p) => {
        const body = decode(stripHtml(p.content))
        const title = nameOf(p)
        return { p, title, body, hay: `${p.title || ''} ${body}`.toLowerCase() }
      }),
    [pages],
  )

  const terms = q.toLowerCase().split(/\s+/).filter(Boolean)
  const results = useMemo(() => {
    if (!terms.length) return []
    return index
      .filter((r) => terms.every((t) => r.hay.includes(t)))
      .sort((a, b) => {
        const ta = terms.every((t) => a.title.toLowerCase().includes(t)) ? 1 : 0
        const tb = terms.every((t) => b.title.toLowerCase().includes(t)) ? 1 : 0
        return tb - ta || b.p.createdMs - a.p.createdMs
      })
  }, [index, q]) // eslint-disable-line react-hooks/exhaustive-deps

  const snippet = (body) => {
    const low = body.toLowerCase()
    const at = low.indexOf(terms.find((t) => low.includes(t)) || '')
    if (at < 0) return body.slice(0, 120)
    const start = Math.max(0, at - 40)
    return (start > 0 ? '…' : '') + body.slice(start, at + 110) + (at + 110 < body.length ? '…' : '')
  }
  const secOf = (id) => sections.find((s) => s.id === id)

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center md:pt-16" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex h-full w-full max-w-2xl flex-col bg-surface text-ink shadow-2xl md:h-auto md:max-h-[78vh] md:rounded-2xl md:border md:border-line"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="flex items-center gap-2 border-b border-line px-4 py-3">
          <IconSearch size={20} className="text-muted" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search all your journals..."
            className="min-w-0 flex-1 bg-transparent text-base outline-none"
          />
          <button onClick={onClose} className="px-1 text-sm text-muted underline">
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2">
          {!terms.length && <p className="px-3 py-6 text-center text-sm text-muted">Je kono shobdo likhe khujun, shob section er page theke khuje debe.</p>}
          {terms.length > 0 && results.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-muted">Kichu pawa jayni.</p>
          )}
          {terms.length > 0 && results.length > 0 && (
            <p className="px-3 pb-1 text-xs text-muted">{results.length} ta page pawa gese</p>
          )}
          {results.slice(0, 80).map(({ p, title, body }) => {
            const sec = secOf(p.sectionId)
            return (
              <button
                key={p.id}
                onClick={() => {
                  onOpen(p)
                  onClose()
                }}
                className="block w-full rounded-xl px-3 py-2.5 text-left active:bg-line md:hover:bg-line"
              >
                <span className="flex items-center gap-2 text-xs text-muted">
                  <span className={`h-2.5 w-2.5 rounded-full ${SECTION_COLORS[sec?.color] || ''}`} />
                  {sec?.name} · {new Date(p.createdMs).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <span className="mt-0.5 block truncate text-[15px] font-semibold">
                  <Highlight text={title} terms={terms} />
                </span>
                <span className="mt-0.5 block text-sm text-muted">
                  <Highlight text={snippet(body)} terms={terms} />
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
