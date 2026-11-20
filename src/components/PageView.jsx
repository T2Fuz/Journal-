import { useEffect, useReducer, useRef, useState } from 'react'
import { PAGE_COLORS, RULE_STYLES } from '../editorOptions.js'
import EditorToolbar from './EditorToolbar.jsx'
import MobileToolbar from './MobileToolbar.jsx'
import { BlockCard, deriveBlocks, isBlockEmpty, newBlockId } from './Blocks.jsx'
import { BottomSheet } from './MobileUI.jsx'
import { IconBack, IconMore, IconPlus, IconTrash } from './Icons.jsx'
import { useVisualViewport } from '../useMobile.js'

// App.jsx gives this component key={page.id}, so switching pages builds a fresh
// PageView (fresh typing state) each time.
// A page = a title + a list of BLOCKS (cards, like Google Keep). Each block has
// its own editor. `content` (all blocks joined) is also saved so the sidebar
// preview and old code keep working.
export default function PageView({ page, dateLabel, onSave, onDelete, mobile, onBack, sectionName }) {
  const vv = useVisualViewport()
  const [title, setTitle] = useState(page.title)
  const [blocks, setBlocks] = useState(() => deriveBlocks(page))
  const [active, setActive] = useState(null) // { id, editor } of the block being edited
  const [focusId, setFocusId] = useState(null) // new block that should get the cursor
  const [pageSheet, setPageSheet] = useState(false)
  const [, bump] = useReducer((x) => x + 1, 0)
  const titleRef = useRef(null)
  const proxyRef = useRef(null)
  const editors = useRef({})
  const activeIdRef = useRef(null)
  const lastSent = useRef(JSON.stringify(deriveBlocks(page)))
  const latest = useRef({})
  const sig = JSON.stringify(blocks)
  latest.current = { title, blocks, page, sig }

  const setActiveBlock = (a) => {
    activeIdRef.current = a ? a.id : null
    setActive(a)
  }

  // Change coming from ANOTHER device -> show it, but never while I'm typing here.
  useEffect(() => {
    if (document.activeElement !== titleRef.current) setTitle(page.title)
  }, [page.title])
  useEffect(() => {
    if (activeIdRef.current) return
    const incoming = JSON.stringify(deriveBlocks(page))
    if (incoming === lastSent.current || incoming === latest.current.sig) return
    lastSent.current = incoming
    setBlocks(deriveBlocks(page))
  }, [page.blocks, page.content]) // eslint-disable-line react-hooks/exhaustive-deps

  const pageSig = JSON.stringify(deriveBlocks(page))
  const payload = (t, b) => ({ title: t, blocks: b, content: b.map((x) => x.html).join('\n') })

  // Auto-save 0.6s after I stop typing.
  useEffect(() => {
    if (title === page.title && sig === pageSig) return
    const t = setTimeout(() => {
      lastSent.current = sig
      onSave(page.id, payload(title, blocks))
    }, 600)
    return () => clearTimeout(t)
  }, [title, sig]) // eslint-disable-line react-hooks/exhaustive-deps

  // If I switch page quickly, save whatever is still unsaved.
  useEffect(
    () => () => {
      const { title, blocks, page, sig } = latest.current
      if (title !== page.title || sig !== JSON.stringify(deriveBlocks(page))) {
        onSave(page.id, payload(title, blocks))
      }
    },
    [], // eslint-disable-line react-hooks/exhaustive-deps
  )

  // ---- block actions ----
  const changeBlock = (id, html) => setBlocks((bs) => bs.map((b) => (b.id === id ? { ...b, html } : b)))
  const colorBlock = (id, color) => setBlocks((bs) => bs.map((b) => (b.id === id ? { ...b, color } : b)))
  const moveBlock = (id, dir) =>
    setBlocks((bs) => {
      const i = bs.findIndex((b) => b.id === id)
      const j = i + dir
      if (i < 0 || j < 0 || j >= bs.length) return bs
      const next = [...bs]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  function deleteBlock(id) {
    const b = blocks.find((x) => x.id === id)
    if (b && !isBlockEmpty(b.html) && !window.confirm('Ei block ta delete korbo?')) return
    setActiveBlock(null)
    setBlocks((bs) => {
      const next = bs.filter((x) => x.id !== id)
      return next.length ? next : [{ id: newBlockId(), html: '', color: 'none' }]
    })
  }
  function addBlock() {
    // iOS only opens the keyboard when focus happens inside the tap itself,
    // so we focus a hidden input first and hand the cursor to the new block after.
    proxyRef.current?.focus()
    const id = newBlockId()
    setBlocks((bs) => [...bs, { id, html: '', color: 'none' }])
    setFocusId(id)
  }
  // Leaving an empty block (when other blocks exist) removes it, like Keep.
  function blurBlock(id) {
    setTimeout(() => {
      if (activeIdRef.current === id) return
      setBlocks((bs) => {
        const b = bs.find((x) => x.id === id)
        if (!b || bs.length < 2 || !isBlockEmpty(b.html) || id === focusIdRef.current) return bs
        return bs.filter((x) => x.id !== id)
      })
    }, 200)
  }
  const focusIdRef = useRef(null)
  focusIdRef.current = focusId

  const color = PAGE_COLORS[page.pageColor] || PAGE_COLORS.none
  const rule = RULE_STYLES.find((r) => r.key === page.ruleStyle) || RULE_STYLES[0]
  const ruleClass = rule.type === 'lines' ? 'rule-lines' : rule.type === 'grid' ? 'rule-grid' : ''
  const ruleVars = rule.size ? { '--rule': `${rule.size}px` } : {}

  const list = (
    <div className="flex-1">
      {blocks.map((b, i) => (
        <BlockCard
          key={b.id}
          block={b}
          index={i}
          total={blocks.length}
          plain={mobile && blocks.length === 1}
          minH={blocks.length === 1 ? (mobile ? '58vh' : 'calc(100vh - 25rem)') : mobile ? '9rem' : '8rem'}
          active={active?.id === b.id}
          autoFocus={focusId === b.id}
          ruleClass={ruleClass}
          ruleVars={ruleVars}
          onChange={changeBlock}
          onFocus={(id, editor) => setActiveBlock({ id, editor })}
          onBlur={blurBlock}
          onReady={(id, editor) => {
            editors.current[id] = editor
            bump()
          }}
          onGone={(id) => {
            delete editors.current[id]
            bump()
          }}
          onColor={colorBlock}
          onMove={moveBlock}
          onDelete={deleteBlock}
          onAutoFocused={() => setFocusId(null)}
        />
      ))}
    </div>
  )

  const proxy = (
    <input
      ref={proxyRef}
      aria-hidden="true"
      tabIndex={-1}
      style={{ position: 'fixed', top: 0, left: 0, width: 1, height: 1, opacity: 0, fontSize: 16, pointerEvents: 'none' }}
    />
  )

  const askDeletePage = () => {
    if (window.confirm('Ei page ta Recycle Bin e pathabo? Pore restore kora jabe.')) onDelete(page.id)
  }

  if (mobile) {
    return (
      <div
        className={`screen-in fixed left-0 right-0 z-10 flex flex-col text-ink ${
          page.pageColor && page.pageColor !== 'none' ? 'paper' : 'bg-cream'
        }`}
        style={{
          top: vv.offsetTop,
          height: vv.height,
          paddingTop: 'env(safe-area-inset-top, 0px)',
          '--page-bg-light': color.light,
          '--page-bg-dark': color.dark,
        }}
      >
        <div className="flex shrink-0 items-center justify-between px-2 py-1">
          <button onClick={onBack} className="flex items-center gap-0.5 rounded-full px-2 py-2 text-sm text-muted active:bg-line">
            <IconBack size={20} />
            <span className="max-w-[12rem] truncate">{sectionName || 'Back'}</span>
          </button>
          <button
            onClick={() => setPageSheet(true)}
            aria-label="Page options"
            className="flex h-10 w-10 items-center justify-center rounded-full text-muted active:bg-line"
          >
            <IconMore size={20} />
          </button>
        </div>

        <div className="relative min-h-0 flex-1">
          <div className="h-full overflow-y-auto overscroll-contain px-4 pb-28">
            <input
              ref={titleRef}
              value={title}
              onFocus={() => setActiveBlock(null)}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="font-display w-full bg-transparent text-3xl font-bold outline-none"
            />
            <p className="mb-3 mt-1 text-xs text-muted">{dateLabel}</p>
            {list}
          </div>
          <button
            onClick={addBlock}
            aria-label="Add block"
            className="fab absolute bottom-4 right-4 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-pink-800 text-white"
          >
            <IconPlus size={26} />
          </button>
        </div>

        {active?.editor && !active.editor.isDestroyed && (
          <MobileToolbar
            editor={active.editor}
            page={page}
            keyboard={vv.keyboard}
            onDismiss={() => setActiveBlock(null)}
            onPageSettings={(fields) => onSave(page.id, fields)}
            onDeletePage={askDeletePage}
          />
        )}

        {pageSheet && (
          <BottomSheet title="Page" onClose={() => setPageSheet(false)}>
            <p className="mb-2 text-xs uppercase tracking-wide text-muted">Page color</p>
            <div className="no-scrollbar mb-4 flex gap-3 overflow-x-auto py-1">
              {Object.entries(PAGE_COLORS).map(([key, c]) => (
                <button
                  key={key}
                  aria-label={c.label}
                  onClick={() => onSave(page.id, { pageColor: key })}
                  className={`h-9 w-9 shrink-0 rounded-full border border-line ${
                    (page.pageColor || 'none') === key ? 'ring-2 ring-pink-600 ring-offset-2 ring-offset-[var(--c-surface)]' : ''
                  }`}
                  style={{ background: c.light }}
                />
              ))}
            </div>
            <p className="mb-2 text-xs uppercase tracking-wide text-muted">Lines</p>
            <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
              {RULE_STYLES.map((r) => (
                <button
                  key={r.key}
                  onClick={() => onSave(page.id, { ruleStyle: r.key })}
                  className={`shrink-0 rounded-full border px-4 py-2 text-sm ${
                    (page.ruleStyle || 'none') === r.key
                      ? 'border-pink-700 bg-pink-200 text-pink-900 dark:bg-pink-900/60 dark:text-pink-100'
                      : 'border-line bg-cream'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setPageSheet(false)
                askDeletePage()
              }}
              className="flex items-center gap-2 rounded-xl px-1 py-2 text-red-500"
            >
              <IconTrash size={18} />
              Delete this page
            </button>
          </BottomSheet>
        )}
        {proxy}
      </div>
    )
  }

  const toolbarEditor =
    (active?.editor && !active.editor.isDestroyed && active.editor) ||
    Object.values(editors.current).find((e) => !e.isDestroyed) ||
    null

  return (
    <main className="min-w-0 flex-1 px-6 pb-20 pt-3 md:px-10 md:pt-4">
      <input
        ref={titleRef}
        value={title}
        onFocus={() => setActiveBlock(null)}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className="mb-1 w-full bg-transparent text-3xl font-bold outline-none"
      />
      <p className="mb-4 text-xs text-muted">{dateLabel}</p>

      {toolbarEditor && (
        <EditorToolbar
          editor={toolbarEditor}
          page={page}
          onPageSettings={(fields) => onSave(page.id, fields)}
        />
      )}

      <div
        className={`flex min-h-[calc(100vh-21rem)] flex-col ${
          page.pageColor && page.pageColor !== 'none' ? 'paper rounded-lg p-3' : ''
        }`}
        style={{ '--page-bg-light': color.light, '--page-bg-dark': color.dark }}
      >
        {list}
        {/* "+" sits in the bottom-right corner of the page area and follows you while scrolling */}
        <div className="sticky bottom-6 z-20 flex h-0 justify-end">
          <button
            onClick={addBlock}
            aria-label="Add block"
            title="New block"
            className="fab absolute bottom-0 right-2 flex h-14 w-14 items-center justify-center rounded-full bg-pink-800 text-white"
          >
            <IconPlus size={26} />
          </button>
        </div>
      </div>
      {proxy}
    </main>
  )
}
