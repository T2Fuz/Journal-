import { useEffect, useRef, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import { buildExtensions, toHtml } from '../editorSetup.js'
import { PAGE_COLORS, RULE_STYLES } from '../editorOptions.js'
import EditorToolbar from './EditorToolbar.jsx'
import MobileToolbar from './MobileToolbar.jsx'
import { IconBack } from './Icons.jsx'
import { useVisualViewport } from '../useMobile.js'

// App.jsx gives this component key={page.id}, so switching pages builds a fresh
// PageView (fresh typing state) each time.
export default function PageView({ page, dateLabel, onSave, onDelete, mobile, onBack, sectionName }) {
  const vv = useVisualViewport()
  const [title, setTitle] = useState(page.title)
  const [content, setContent] = useState(page.content) // HTML string
  const titleRef = useRef(null)
  const lastSent = useRef(page.content)
  const latest = useRef({})
  latest.current = { title, content, page }

  const editor = useEditor({
    extensions: buildExtensions(),
    content: toHtml(page.content),
    editorProps: { attributes: { class: 'journal-editor' } },
    onUpdate: ({ editor }) => setContent(editor.getHTML()),
  })

  // Change coming from ANOTHER device -> show it, but never while I'm typing here.
  useEffect(() => {
    if (document.activeElement !== titleRef.current) setTitle(page.title)
  }, [page.title])

  useEffect(() => {
    if (!editor || editor.isFocused) return
    if (page.content === lastSent.current) return // that's just my own save coming back
    if (editor.getHTML() === page.content) return
    editor.commands.setContent(toHtml(page.content), false)
    setContent(page.content)
    lastSent.current = page.content
  }, [page.content, editor])

  // Auto-save 0.6s after I stop typing.
  useEffect(() => {
    if (title === page.title && content === page.content) return
    const t = setTimeout(() => {
      lastSent.current = content
      onSave(page.id, { title, content })
    }, 600)
    return () => clearTimeout(t)
  }, [title, content]) // eslint-disable-line react-hooks/exhaustive-deps

  // If I switch page quickly, save whatever is still unsaved.
  useEffect(
    () => () => {
      const { title, content, page } = latest.current
      if (title !== page.title || content !== page.content) {
        onSave(page.id, { title, content })
      }
    },
    [], // eslint-disable-line react-hooks/exhaustive-deps
  )

  const color = PAGE_COLORS[page.pageColor] || PAGE_COLORS.none
  const rule = RULE_STYLES.find((r) => r.key === page.ruleStyle) || RULE_STYLES[0]
  const ruleClass = rule.type === 'lines' ? 'rule-lines' : rule.type === 'grid' ? 'rule-grid' : ''
  const ruleVars = rule.size ? { '--rule': `${rule.size}px` } : {}

  if (mobile) {
    return (
      <div
        className="screen-in fixed left-0 right-0 z-10 flex flex-col bg-cream text-ink"
        style={{
          top: vv.offsetTop,
          height: vv.height,
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
      >
        <div className="flex shrink-0 items-center px-2 py-1">
          <button onClick={onBack} className="flex items-center gap-0.5 rounded-full px-2 py-2 text-sm text-muted active:bg-line">
            <IconBack size={20} />
            <span className="max-w-[12rem] truncate">{sectionName || 'Back'}</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-6">
          <input
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="font-display w-full bg-transparent text-3xl font-bold outline-none"
          />
          <p className="mb-3 mt-1 text-xs text-muted">{dateLabel}</p>
          <div
            className="paper min-h-[60vh] rounded-2xl border border-line"
            style={{ '--page-bg-light': color.light, '--page-bg-dark': color.dark }}
            onClick={(e) => {
              if (e.target === e.currentTarget || e.target.classList.contains('rule-lines') || e.target.classList.contains('rule-grid') || e.target.classList.contains('mobile-pad')) {
                editor?.commands.focus('end')
              }
            }}
          >
            <div className={`${ruleClass} mobile-pad min-h-[60vh]`} style={{ ...ruleVars, padding: '16px 16px' }}>
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>

        {editor && (
          <MobileToolbar
            editor={editor}
            page={page}
            keyboard={vv.keyboard}
            onPageSettings={(fields) => onSave(page.id, fields)}
            onDeletePage={() => {
              if (window.confirm('Send this page to the Recycle Bin? You can restore it later.')) onDelete(page.id)
            }}
          />
        )}
      </div>
    )
  }

  return (
    <main className="flex-1 px-6 md:px-10 pt-3 md:pt-4 pb-6 md:pb-10 min-w-0">
      <input
        ref={titleRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className="w-full text-3xl font-bold mb-1 bg-transparent outline-none"
      />
      <p className="text-xs text-muted mb-4">{dateLabel}</p>

      {editor && (
        <EditorToolbar
          editor={editor}
          page={page}
          onPageSettings={(fields) => onSave(page.id, fields)}
        />
      )}

      <div
        className="paper border border-line rounded-lg"
        style={{ '--page-bg-light': color.light, '--page-bg-dark': color.dark }}
      >
        <div className={ruleClass} style={{ ...ruleVars, padding: '20px 24px' }}>
          <EditorContent editor={editor} />
        </div>
      </div>

      <button
        onClick={() => {
          if (window.confirm('Ei page ta Recycle Bin e pathabo? Pore restore kora jabe.')) onDelete(page.id)
        }}
        className="mt-6 text-xs text-muted underline"
      >
        Delete this page
      </button>
    </main>
  )
}
