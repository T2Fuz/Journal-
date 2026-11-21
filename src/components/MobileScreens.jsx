import { useState } from 'react'
import { SECTION_COLORS } from '../colors.js'
import { deriveTitle, stripHtml } from '../titleUtils.js'
import { ActionSheet, BottomSheet, Fab, SectionSheet } from './MobileUI.jsx'
import SyncPill from './SyncPill.jsx'
import {
  IconBack,
  IconBook,
  IconChevron,
  IconLogout,
  IconMore,
  IconPage,
  IconTrash,
} from './Icons.jsx'

function dateLine(ms) {
  const d = new Date(ms)
  const day = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return `${day} · ${time}`
}

// ───────────── Screen 1: all sections ─────────────
export function SectionsScreen({
  notebookName,
  onRenameNotebook,
  sections,
  pages,
  username,
  theme,
  onToggleTheme,
  onLogout,
  trashCount,
  onOpenTrash,
  onOpenImport,
  syncProps,
  onOpen,
  onCreate,
  onUpdate,
  onCopy,
  onDelete,
  onMove,
}) {
  const [sheet, setSheet] = useState(null) // {type:'add'} | {type:'edit',section} | {type:'menu',section} | {type:'account'}
  const [editingName, setEditingName] = useState(false)

  return (
    <div
      className="screen-in fixed inset-0 z-10 flex flex-col bg-cream text-ink"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <header className="px-5 pt-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Notebook</p>
            {editingName ? (
              <input
                autoFocus
                defaultValue={notebookName}
                onBlur={(e) => {
                  onRenameNotebook(e.target.value)
                  setEditingName(false)
                }}
                onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
                className="font-display w-full bg-transparent text-3xl font-bold outline-none border-b border-line"
              />
            ) : (
              <button
                onClick={() => setEditingName(true)}
                className="font-display block max-w-full truncate text-left text-3xl font-bold leading-tight"
              >
                {notebookName}
              </button>
            )}
          </div>
          <button
            onClick={() => setSheet({ type: 'account' })}
            aria-label="Account"
            className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-800 text-base font-bold uppercase text-white"
          >
            {(username || '').replace(/[^a-zA-Z0-9]/g, '')[0] || '?'}
          </button>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-muted">
          <span>
            {sections.length} {sections.length === 1 ? 'section' : 'sections'}
          </span>
          <span>·</span>
          <span>
            {pages.length} {pages.length === 1 ? 'page' : 'pages'}
          </span>
          <span className="ml-auto">
            <SyncPill {...syncProps} />
          </span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-32 pt-1">
        {sections.length === 0 && (
          <div className="mt-16 flex flex-col items-center text-center text-muted">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-surface border border-line">
              <IconBook size={36} />
            </div>
            <p className="font-display text-lg text-ink">Your notebook is empty</p>
            <p className="mt-1 text-sm">Tap the + button to make your first section.</p>
          </div>
        )}
        <ul className="flex flex-col gap-3">
          {sections.map((s) => {
            const mine = pages
              .filter((p) => p.sectionId === s.id)
              .sort((a, b) => b.createdMs - a.createdMs)
            const latest = mine[0]
            return (
              <li key={s.id} className="card-press flex items-stretch overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
                <button onClick={() => onOpen(s)} className="flex min-w-0 flex-1 items-stretch text-left">
                  <span className={`w-3.5 shrink-0 ${SECTION_COLORS[s.color] || SECTION_COLORS.stone}`} />
                  <span className="min-w-0 flex-1 px-4 py-3.5">
                    <span className="font-display block truncate text-lg font-semibold">{s.name}</span>
                    <span className="mt-0.5 block truncate text-sm text-muted">
                      {latest ? deriveTitle(latest.content || latest.title, 5) : 'No pages yet'}
                    </span>
                    <span className="mt-1.5 inline-block rounded-full bg-line/60 px-2 py-0.5 text-[11px] text-muted">
                      {mine.length} {mine.length === 1 ? 'page' : 'pages'}
                    </span>
                  </span>
                  <span className="flex items-center pr-1 text-muted">
                    <IconChevron size={18} />
                  </span>
                </button>
                <button
                  onClick={() => setSheet({ type: 'menu', section: s })}
                  aria-label="Section options"
                  className="flex w-11 items-center justify-center text-muted active:bg-line"
                >
                  <IconMore size={20} />
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      <Fab label="Add section" onClick={() => setSheet({ type: 'add' })} />

      {sheet?.type === 'add' && (
        <SectionSheet mode="add" onSave={onCreate} onClose={() => setSheet(null)} />
      )}
      {sheet?.type === 'edit' && (
        <SectionSheet
          mode="edit"
          initial={sheet.section}
          onSave={(name, color) => onUpdate(sheet.section.id, { name, color })}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet?.type === 'menu' && (
        <ActionSheet
          title={sheet.section.name}
          onClose={() => setSheet(null)}
          actions={[
            { label: 'Rename / change color', onClick: () => setSheet({ type: 'edit', section: sheet.section }) },
            { label: 'Move up', disabled: sections[0]?.id === sheet.section.id, onClick: () => onMove(sheet.section, -1) },
            {
              label: 'Move down',
              disabled: sections[sections.length - 1]?.id === sheet.section.id,
              onClick: () => onMove(sheet.section, 1),
            },
            { label: 'Copy', onClick: () => onCopy(sheet.section) },
            { label: 'Delete', danger: true, onClick: () => onDelete(sheet.section) },
          ]}
        />
      )}
      {sheet?.type === 'account' && (
        <BottomSheet title={username} onClose={() => setSheet(null)}>
          <div className="flex flex-col gap-1">
            <button
              onClick={onToggleTheme}
              className="flex items-center justify-between rounded-xl px-3 py-3.5 text-base active:bg-line"
            >
              <span>Dark mode</span>
              <span
                className={`relative h-6 w-11 rounded-full transition-colors ${theme === 'dark' ? 'bg-pink-800' : 'bg-line'}`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${theme === 'dark' ? 'left-[22px]' : 'left-0.5'}`}
                />
              </span>
            </button>
            <button
              onClick={() => {
                setSheet(null)
                onOpenTrash()
              }}
              className="flex items-center gap-3 rounded-xl px-3 py-3.5 text-left text-base active:bg-line"
            >
              <IconTrash />
              Recycle Bin{trashCount ? ` (${trashCount})` : ''}
            </button>
            <button
              onClick={() => {
                setSheet(null)
                onOpenImport()
              }}
              className="flex items-center gap-3 rounded-xl px-3 py-3.5 text-left text-base active:bg-line"
            >
              <IconPage />
              Import from OneNote
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-3 rounded-xl px-3 py-3.5 text-left text-base text-red-500 active:bg-line"
            >
              <IconLogout />
              Logout
            </button>
          </div>
        </BottomSheet>
      )}
    </div>
  )
}

// ───────────── Screen 2: pages inside one section ─────────────
export function PagesScreen({ section, pages, onBack, onOpen, onAdd, onRename, onCopy, onDelete, onUpdateSection, onCopySection, onDeleteSection }) {
  const [menuPage, setMenuPage] = useState(null)
  const [secMenu, setSecMenu] = useState(false)
  const [secEdit, setSecEdit] = useState(false)
  const color = SECTION_COLORS[section.color] || SECTION_COLORS.stone

  return (
    <div
      className="screen-in fixed inset-0 z-10 flex flex-col bg-cream text-ink"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <header className="px-3 pt-2 pb-3">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-0.5 rounded-full px-2 py-2 text-sm text-muted active:bg-line">
            <IconBack size={20} />
            All sections
          </button>
          <button
            onClick={() => setSecMenu(true)}
            aria-label="Section options"
            className="flex h-10 w-10 items-center justify-center rounded-full text-muted active:bg-line"
          >
            <IconMore size={20} />
          </button>
        </div>
        <div className="mt-1 flex items-center gap-3 px-2">
          <span className={`h-9 w-2.5 shrink-0 rounded-full ${color}`} />
          <div className="min-w-0">
            <h1 className="font-display truncate text-3xl font-bold leading-tight">{section.name}</h1>
            <p className="text-xs text-muted">
              {pages.length} {pages.length === 1 ? 'page' : 'pages'}
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-32">
        {pages.length === 0 && (
          <div className="mt-16 flex flex-col items-center text-center text-muted">
            <p className="font-display text-lg text-ink">No pages yet</p>
            <p className="mt-1 text-sm">Tap the + button to write your first page.</p>
          </div>
        )}
        <ul className="flex flex-col gap-2.5">
          {pages.map((p) => {
            const preview = stripHtml(p.content)
            return (
              <li key={p.id} className="card-press flex items-stretch overflow-hidden rounded-2xl border border-line bg-surface">
                <button onClick={() => onOpen(p)} className="min-w-0 flex-1 px-4 py-3 text-left">
                  <span className="block truncate text-base font-semibold">
                    {p.title || deriveTitle(p.content)}
                  </span>
                  <span className="mt-0.5 block text-xs font-medium text-pink-700 dark:text-pink-300">
                    {dateLine(p.createdMs)}
                  </span>
                  {p.title && preview && (
                    <span className="mt-1 block truncate text-sm text-muted">{preview}</span>
                  )}
                </button>
                <button
                  onClick={() => setMenuPage(p)}
                  aria-label="Page options"
                  className="flex w-11 items-center justify-center text-muted active:bg-line"
                >
                  <IconMore size={20} />
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      <Fab label="Add page" onClick={onAdd} />

      {menuPage && (
        <ActionSheet
          title={menuPage.title || deriveTitle(menuPage.content)}
          onClose={() => setMenuPage(null)}
          actions={[
            { label: 'Rename', onClick: () => onRename(menuPage) },
            { label: 'Copy', onClick: () => onCopy(menuPage) },
            { label: 'Delete', danger: true, onClick: () => onDelete(menuPage) },
          ]}
        />
      )}
      {secMenu && (
        <ActionSheet
          title={section.name}
          onClose={() => setSecMenu(false)}
          actions={[
            { label: 'Rename / change color', onClick: () => setSecEdit(true) },
            { label: 'Copy section', onClick: () => onCopySection(section) },
            { label: 'Delete section', danger: true, onClick: () => onDeleteSection(section) },
          ]}
        />
      )}
      {secEdit && (
        <SectionSheet
          mode="edit"
          initial={section}
          onSave={(name, color) => onUpdateSection(section.id, { name, color })}
          onClose={() => setSecEdit(false)}
        />
      )}
    </div>
  )
}
