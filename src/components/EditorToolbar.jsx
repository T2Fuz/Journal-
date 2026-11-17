import { useEffect, useReducer, useRef, useState } from 'react'
import {
  FONT_FAMILIES,
  FONT_SIZES,
  HIGHLIGHT_COLORS,
  PAGE_COLORS,
  RULE_STYLES,
  TEXT_COLORS,
} from '../editorOptions.js'
import { uploadToCloudinary } from '../cloudinary.js'
import { insertBlockAtEnd } from '../editorSetup.js'
import AudioRecorder from './AudioRecorder.jsx'

const norm = (s) => (s || '').replace(/['"]/g, '')

const btnBase = 'h-8 min-w-8 px-2 rounded-md text-sm flex items-center justify-center gap-1 hover:bg-line'
const btnOn = 'bg-pink-200 text-pink-900 dark:bg-pink-900/60 dark:text-pink-100'
const keepFocus = (e) => e.preventDefault() // so clicking a button doesn't steal the cursor from the editor

function Btn({ onClick, active, title, children }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={keepFocus}
      onClick={onClick}
      className={`${btnBase} ${active ? btnOn : ''}`}
    >
      {children}
    </button>
  )
}

function Menu({ label, title, children }) {
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
    <div ref={ref} className="relative">
      <button
        type="button"
        title={title}
        onMouseDown={keepFocus}
        onClick={() => setOpen((o) => !o)}
        className={`${btnBase} ${open ? btnOn : ''}`}
      >
        {label}
        <span className="text-[10px]">▾</span>
      </button>
      {open && (
        <div
          onMouseDown={keepFocus}
          className="absolute left-0 top-full mt-1 z-30 min-w-[11rem] rounded-lg border border-line bg-surface text-ink shadow-lg p-2"
        >
          {typeof children === 'function' ? children(() => setOpen(false)) : children}
        </div>
      )}
    </div>
  )
}

const itemCls = 'block w-full text-left px-3 py-1.5 rounded-md text-sm hover:bg-line'
const Sep = () => <span className="w-px h-5 bg-line mx-1" />
const selectCls = 'h-8 rounded-md border border-line bg-surface text-ink text-sm px-1.5'

export default function EditorToolbar({ editor, page, onPageSettings }) {
  const [, rerender] = useReducer((x) => x + 1, 0)
  useEffect(() => {
    editor.on('transaction', rerender)
    return () => {
      editor.off('transaction', rerender)
    }
  }, [editor])

  const [notice, setNotice] = useState('')
  const [recording, setRecording] = useState(false)
  const imageRef = useRef(null)
  const audioRef = useRef(null)

  const chain = () => editor.chain().focus()
  const textStyle = editor.getAttributes('textStyle')
  const currentColor = textStyle.color || ''
  const currentFamily = norm(textStyle.fontFamily)
  const currentSize = textStyle.fontSize || ''

  async function pickFile(e, resourceType) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setNotice(resourceType === 'image' ? 'Image upload hocche...' : 'Audio upload hocche...')
    try {
      const url = await uploadToCloudinary(file, resourceType)
      if (resourceType === 'image') insertBlockAtEnd(editor, { type: 'image', attrs: { src: url } })
      else insertBlockAtEnd(editor, { type: 'audio', attrs: { src: url } })
      setNotice('')
    } catch (err) {
      setNotice(err.message)
    }
  }

  return (
    <div className="sticky top-0 z-20 bg-cream pb-2">
      <div className="flex flex-wrap items-center gap-0.5 rounded-lg border border-line bg-surface px-1.5 py-1">
        <Btn title="Undo" onClick={() => chain().undo().run()}>↶</Btn>
        <Btn title="Redo" onClick={() => chain().redo().run()}>↷</Btn>
        <Sep />

        <select
          title="Font"
          className={selectCls}
          value={currentFamily}
          onChange={(e) => {
            const f = FONT_FAMILIES.find((x) => norm(x.value) === e.target.value)
            if (f?.value) chain().setFontFamily(f.value).run()
            else chain().unsetFontFamily().run()
          }}
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f.label} value={norm(f.value)}>
              {f.label}
            </option>
          ))}
        </select>
        <select
          title="Font size"
          className={selectCls}
          value={currentSize}
          onChange={(e) => {
            if (e.target.value) chain().setFontSize(e.target.value).run()
            else chain().unsetFontSize().run()
          }}
        >
          <option value="">Size</option>
          {FONT_SIZES.map((s) => (
            <option key={s} value={s}>
              {parseInt(s, 10)}
            </option>
          ))}
        </select>
        <Sep />

        <Btn title="Bold" active={editor.isActive('bold')} onClick={() => chain().toggleBold().run()}>
          <b>B</b>
        </Btn>
        <Btn title="Italic" active={editor.isActive('italic')} onClick={() => chain().toggleItalic().run()}>
          <i>I</i>
        </Btn>
        <Btn title="Underline" active={editor.isActive('underline')} onClick={() => chain().toggleUnderline().run()}>
          <u>U</u>
        </Btn>
        <Btn title="Strikethrough" active={editor.isActive('strike')} onClick={() => chain().toggleStrike().run()}>
          <s>S</s>
        </Btn>
        <Btn
          title="Heading (separate entries within one page)"
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => chain().toggleHeading({ level: 2 }).run()}
        >
          H
        </Btn>
        <Sep />

        <Menu
          title="Font color"
          label={
            <span className="font-bold" style={{ borderBottom: `3px solid ${currentColor || 'currentColor'}`, lineHeight: 1 }}>
              A
            </span>
          }
        >
          {(close) => (
            <div>
              <button
                className={itemCls}
                onClick={() => {
                  chain().unsetColor().run()
                  close()
                }}
              >
                Automatic
              </button>
              <div className="grid grid-cols-5 gap-1.5 p-1">
                {TEXT_COLORS.map((c) => (
                  <button
                    key={c.value}
                    title={c.label}
                    onClick={() => {
                      chain().setColor(c.value).run()
                      close()
                    }}
                    className="w-6 h-6 rounded border border-line"
                    style={{ background: c.value }}
                  />
                ))}
              </div>
            </div>
          )}
        </Menu>
        <Menu
          title="Highlight"
          label={
            <span className="px-1 rounded font-bold" style={{ background: '#fff176', color: '#1a1a1a' }}>
              H
            </span>
          }
        >
          {(close) => (
            <div>
              <button
                className={itemCls}
                onClick={() => {
                  chain().unsetHighlight().run()
                  close()
                }}
              >
                No highlight
              </button>
              <div className="grid grid-cols-6 gap-1.5 p-1">
                {HIGHLIGHT_COLORS.map((c) => (
                  <button
                    key={c.value}
                    title={c.label}
                    onClick={() => {
                      chain().setHighlight({ color: c.value }).run()
                      close()
                    }}
                    className="w-6 h-6 rounded border border-line"
                    style={{ background: c.value }}
                  />
                ))}
              </div>
            </div>
          )}
        </Menu>
        <Sep />

        <Btn title="Bullet list" active={editor.isActive('bulletList')} onClick={() => chain().toggleBulletList().run()}>
          • List
        </Btn>
        <Btn title="Numbered list" active={editor.isActive('orderedList')} onClick={() => chain().toggleOrderedList().run()}>
          1. List
        </Btn>
        <Btn title="To-do checklist" active={editor.isActive('taskList')} onClick={() => chain().toggleTaskList().run()}>
          ☑ To-do
        </Btn>
        <Sep />

        <Menu title="Insert" label="Insert">
          {(close) => (
            <div>
              <button
                className={itemCls}
                onClick={() => {
                  close()
                  imageRef.current?.click()
                }}
              >
                🖼 Image
              </button>
              <button
                className={itemCls}
                onClick={() => {
                  close()
                  setRecording(true)
                }}
              >
                🎙 Record audio
              </button>
              <button
                className={itemCls}
                onClick={() => {
                  close()
                  audioRef.current?.click()
                }}
              >
                🎵 Audio file
              </button>
              <button
                className={itemCls}
                onClick={() => {
                  chain().insertTable({ rows: 3, cols: 3, withHeaderRow: false }).run()
                  close()
                }}
              >
                ▦ Table
              </button>
              <button
                className={itemCls}
                onClick={() => {
                  chain().setHorizontalRule().run()
                  close()
                }}
              >
                ➗ Divider (notun entry)
              </button>
            </div>
          )}
        </Menu>

        <Menu title="Page color and lines" label="Page">
          {(close) => (
            <div className="w-56">
              <p className="px-1 pb-1 text-xs text-muted">Page color</p>
              <div className="grid grid-cols-4 gap-1.5 p-1 mb-2">
                {Object.entries(PAGE_COLORS).map(([key, c]) => (
                  <button
                    key={key}
                    title={c.label}
                    onClick={() => onPageSettings({ pageColor: key })}
                    className={`h-7 rounded border ${
                      (page.pageColor || 'none') === key ? 'border-pink-600 ring-2 ring-pink-500' : 'border-line'
                    }`}
                    style={{ background: c.light }}
                  />
                ))}
              </div>
              <p className="px-1 pb-1 text-xs text-muted">Rule lines</p>
              {RULE_STYLES.map((r) => (
                <button
                  key={r.key}
                  className={`${itemCls} ${(page.ruleStyle || 'none') === r.key ? btnOn : ''}`}
                  onClick={() => {
                    onPageSettings({ ruleStyle: r.key })
                    close()
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}
        </Menu>

        {editor.isActive('table') && (
          <>
            <Sep />
            <Btn title="Add row" onClick={() => chain().addRowAfter().run()}>+Row</Btn>
            <Btn title="Add column" onClick={() => chain().addColumnAfter().run()}>+Col</Btn>
            <Btn title="Delete row" onClick={() => chain().deleteRow().run()}>−Row</Btn>
            <Btn title="Delete column" onClick={() => chain().deleteColumn().run()}>−Col</Btn>
            <Btn title="Delete table" onClick={() => chain().deleteTable().run()}>🗑 Table</Btn>
          </>
        )}
      </div>

      {notice && <p className="text-xs text-red-600 mt-1.5">{notice}</p>}

      <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={(e) => pickFile(e, 'image')} />
      <input ref={audioRef} type="file" accept="audio/*" className="hidden" onChange={(e) => pickFile(e, 'video')} />

      {recording && (
        <AudioRecorder
          onClose={() => setRecording(false)}
          onDone={(url) => {
            insertBlockAtEnd(editor, { type: 'audio', attrs: { src: url } })
            setRecording(false)
          }}
        />
      )}
    </div>
  )
}
