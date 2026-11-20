import { useEffect, useState } from 'react'
import { IconPlus } from './Icons.jsx'
import { COLOR_KEYS, SECTION_COLORS } from '../colors.js'

// Slides up from the bottom — used for menus and the "new section" form.
export function BottomSheet({ onClose, title, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/45 fade-in" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="sheet-up relative w-full rounded-t-3xl bg-surface text-ink border-t border-line px-5 pt-3 shadow-2xl"
        style={{ paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line" />
        {title && <h2 className="font-display text-xl font-semibold mb-3 truncate">{title}</h2>}
        {children}
      </div>
    </div>
  )
}

// List of tap-able actions (Rename / Copy / Delete ...).
export function ActionSheet({ title, actions, onClose }) {
  return (
    <BottomSheet title={title} onClose={onClose}>
      <div className="flex flex-col gap-1">
        {actions.map((a) => (
          <button
            key={a.label}
            disabled={a.disabled}
            onClick={() => {
              onClose()
              a.onClick()
            }}
            className={`flex items-center gap-3 rounded-xl px-3 py-3.5 text-left text-base active:bg-line disabled:opacity-35 ${
              a.danger ? 'text-red-500' : ''
            }`}
          >
            {a.icon}
            {a.label}
          </button>
        ))}
      </div>
    </BottomSheet>
  )
}

// The round "+" button, bottom-right of every list screen.
export function Fab({ onClick, label }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="fab fixed right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-pink-800 text-white"
      style={{ bottom: 'calc(20px + env(safe-area-inset-bottom, 0px))' }}
    >
      <IconPlus size={26} />
    </button>
  )
}

// New section / edit section: a name and a color.
export function SectionSheet({ mode, initial, onSave, onClose }) {
  const [name, setName] = useState(initial?.name || '')
  const [color, setColor] = useState(initial?.color || COLOR_KEYS[0])
  const ok = name.trim().length > 0
  const submit = () => {
    if (!ok) return
    onSave(name.trim(), color)
    onClose()
  }
  return (
    <BottomSheet title={mode === 'add' ? 'New section' : 'Edit section'} onClose={onClose}>
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="Section name"
        className="w-full rounded-xl border border-line bg-cream px-4 py-3 text-base outline-none focus:border-pink-700"
      />
      <p className="mt-4 mb-2 text-xs uppercase tracking-wide text-muted">Color</p>
      <div className="flex flex-wrap gap-3">
        {COLOR_KEYS.map((k) => (
          <button
            key={k}
            aria-label={k}
            onClick={() => setColor(k)}
            className={`h-9 w-9 rounded-full ${SECTION_COLORS[k]} ${
              color === k ? 'ring-2 ring-offset-2 ring-pink-700 ring-offset-[var(--c-surface)]' : ''
            }`}
          />
        ))}
      </div>
      <button
        disabled={!ok}
        onClick={submit}
        className="mt-6 w-full rounded-2xl bg-pink-800 py-3.5 text-base font-semibold text-white active:bg-pink-900 disabled:opacity-40"
      >
        {mode === 'add' ? 'Create section' : 'Save'}
      </button>
    </BottomSheet>
  )
}
