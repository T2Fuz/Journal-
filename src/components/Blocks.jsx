import { useEffect, useRef, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import { buildExtensions, toHtml } from '../editorSetup.js'
import { PAGE_COLORS } from '../editorOptions.js'
import { stripHtml } from '../titleUtils.js'
import { IconArrowDown, IconArrowUp, IconPalette, IconTrash } from './Icons.jsx'

const keepFocus = (e) => e.preventDefault()

export const newBlockId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36)

// A page keeps a list of blocks. Old pages (before blocks) become ONE block.
export function deriveBlocks(page) {
  if (Array.isArray(page.blocks) && page.blocks.length) return page.blocks
  return [{ id: 'b0', html: toHtml(page.content), color: 'none' }]
}

export const isBlockEmpty = (html) =>
  !stripHtml(html || '') && !/<(img|audio|table|hr)/i.test(html || '')

function ActionBtn({ label, onClick, disabled, danger, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onMouseDown={keepFocus}
      onClick={onClick}
      className={`flex h-9 w-9 items-center justify-center rounded-full active:bg-line disabled:opacity-30 ${
        danger ? 'text-red-500' : 'text-muted'
      }`}
    >
      {children}
    </button>
  )
}

// One Google-Keep-style card. It has its own editor.
export function BlockCard({
  block,
  active,
  autoFocus,
  index,
  total,
  ruleClass,
  ruleVars,
  onChange,
  onFocus,
  onBlur,
  onReady,
  onGone,
  onColor,
  onMove,
  onDelete,
  onAutoFocused,
}) {
  const cb = useRef({})
  cb.current = { onChange, onFocus, onBlur }
  const cardRef = useRef(null)
  const [palette, setPalette] = useState(false)

  const editor = useEditor({
    extensions: buildExtensions(),
    content: toHtml(block.html),
    editorProps: { attributes: { class: 'journal-editor' } },
    onUpdate: ({ editor }) => cb.current.onChange(block.id, editor.getHTML()),
    onFocus: ({ editor }) => cb.current.onFocus(block.id, editor),
    onBlur: () => cb.current.onBlur(block.id),
  })

  useEffect(() => {
    if (!editor) return
    onReady(block.id, editor)
    return () => onGone(block.id, editor)
  }, [editor]) // eslint-disable-line react-hooks/exhaustive-deps

  // Change from ANOTHER device -> show it, but never while I'm typing here.
  useEffect(() => {
    if (!editor || editor.isFocused) return
    if (editor.getHTML() === toHtml(block.html)) return
    editor.commands.setContent(toHtml(block.html), false)
  }, [block.html, editor])

  // A brand-new block (the + button) gets the cursor right away.
  useEffect(() => {
    if (!editor || !autoFocus) return
    editor.commands.focus('end')
    cardRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    onAutoFocused()
  }, [editor, autoFocus]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!active) setPalette(false)
  }, [active])

  const color = PAGE_COLORS[block.color] || PAGE_COLORS.none

  return (
    <div
      ref={cardRef}
      className={`block-card mb-3 break-inside-avoid rounded-2xl border px-4 pt-3 pb-2 shadow-sm ${
        active ? 'border-pink-600 ring-1 ring-pink-600/40' : 'border-line'
      }`}
      style={{ '--blk-light': color.light, '--blk-dark': color.dark }}
    >
      <div className={ruleClass} style={ruleVars}>
        <EditorContent editor={editor} />
      </div>

      {active && (
        <div className="mt-1 -mx-2 flex flex-wrap items-center gap-0.5">
          <ActionBtn label="Block color" onClick={() => setPalette((p) => !p)}>
            <IconPalette size={18} />
          </ActionBtn>
          <ActionBtn label="Move up" disabled={index === 0} onClick={() => onMove(block.id, -1)}>
            <IconArrowUp size={18} />
          </ActionBtn>
          <ActionBtn label="Move down" disabled={index === total - 1} onClick={() => onMove(block.id, 1)}>
            <IconArrowDown size={18} />
          </ActionBtn>
          <span className="flex-1" />
          <ActionBtn label="Delete block" danger onClick={() => onDelete(block.id)}>
            <IconTrash size={18} />
          </ActionBtn>
        </div>
      )}
      {active && palette && (
        <div className="no-scrollbar -mx-1 mb-1 mt-1 flex gap-2 overflow-x-auto px-1 py-1">
          {Object.entries(PAGE_COLORS).map(([key, c]) => (
            <button
              key={key}
              type="button"
              aria-label={c.label}
              onMouseDown={keepFocus}
              onClick={() => onColor(block.id, key)}
              className={`h-8 w-8 shrink-0 rounded-full border border-line ${
                (block.color || 'none') === key ? 'ring-2 ring-pink-600 ring-offset-2 ring-offset-[var(--c-surface)]' : ''
              }`}
              style={{ background: c.light }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
