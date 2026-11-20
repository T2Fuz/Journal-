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
import {
  IconBullet,
  IconCheck,
  IconDivider,
  IconImage,
  IconKeyboardDown,
  IconMic,
  IconMusic,
  IconNumber,
  IconPage,
  IconPlus,
  IconRedo,
  IconTable,
  IconTrash,
  IconUndo,
} from './Icons.jsx'

const norm = (s) => (s || '').replace(/['\"]/g, '')
const keepFocus = (e) => e.preventDefault() // tapping a tool must not close the keyboard

function Tb({ onClick, active, label, children, wide }) {
  return (
    <button
      type="button"
      aria-label={label}
      onMouseDown={keepFocus}
      onClick={onClick}
      className={`flex h-11 shrink-0 items-center justify-center rounded-xl text-[15px] ${
        wide ? 'min-w-[3rem] px-2' : 'w-11'
      } ${active ? 'bg-pink-200 text-pink-900 dark:bg-pink-900/60 dark:text-pink-100' : 'text-ink active:bg-line'}`}
    >
      {children}
    </button>
  )
}
const Sep = () => <span className="mx-1 h-6 w-px shrink-0 bg-line" />

function Chip({ active, onClick, children, style }) {
  return (
    <button
      type="button"
      onMouseDown={keepFocus}
      onClick={onClick}
      style={style}
      className={`shrink-0 rounded-full border px-4 py-2 text-sm ${
        active
          ? 'border-pink-700 bg-pink-200 text-pink-900 dark:bg-pink-900/60 dark:text-pink-100'
          : 'border-line bg-cream text-ink'
      }`}
    >
      {children}
    </button>
  )
}

const Row = ({ title, children }) => (
  <div className="mb-3 last:mb-0">
    {title && <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted">{title}</p>}
    <div className="no-scrollbar flex gap-2 overflow-x-auto pb-0.5">{children}</div>
  </div>
)

const Swatch = ({ color, label, onClick, active }) => (
  <button
    type="button"
    aria-label={label}
    onMouseDown={keepFocus}
    onClick={onClick}
    className={`h-9 w-9 shrink-0 rounded-full border border-line ${
      active ? 'ring-2 ring-pink-600 ring-offset-2 ring-offset-[var(--c-surface)]' : ''
    }`}
    style={{ background: color }}
  />
)

export default function MobileToolbar({ editor, page, onPageSettings, onDeletePage, keyboard }) {
  const [, rerender] = useReducer((x) => x + 1, 0)
  useEffect(() => {
    editor.on('transaction', rerender)
    return () => editor.off('transaction', rerender)
  }, [editor])

  const [tray, setTray] = useState(null)
  const [notice, setNotice] = useState('')
  const [recording, setRecording] = useState(false)
  const imageRef = useRef(null)
  const audioRef = useRef(null)

  const chain = () => editor.chain().focus()
  const toggleTray = (t) => setTray((cur) => (cur === t ? null : t))
  const ts = editor.getAttributes('textStyle')
  const curColor = ts.color || ''
  const curFamily = norm(ts.fontFamily)
  const curSize = ts.fontSize || ''
  const inTable = editor.isActive('table')

  async function pickFile(e, resourceType) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setNotice(resourceType === 'image' ? 'Uploading image...' : 'Uploading audio...')
    try {
      const url = await uploadToCloudinary(file, resourceType)
      insertBlockAtEnd(editor, { type: resourceType === 'image' ? 'image' : 'audio', attrs: { src: url } })
      setNotice('')
    } catch (err) {
      setNotice(err.message)
    }
  }

  const tile = (icon, label, fn) => (
    <button
      key={label}
      type="button"
      onMouseDown={keepFocus}
      onClick={() => {
        setTray(null)
        fn()
      }}
      className="flex w-[4.6rem] shrink-0 flex-col items-center gap-1.5 rounded-2xl border border-line bg-cream py-3 text-xs active:bg-line"
    >
      {icon}
      {label}
    </button>
  )

  return (
    <div
      className="shrink-0 border-t border-line bg-surface text-ink"
      style={{ paddingBottom: keyboard ? 0 : 'env(safe-area-inset-bottom, 0px)' }}
    >
      {notice && <p className="px-4 pt-2 text-xs text-red-500">{notice}</p>}

      {tray && (
        <div className="tray-up max-h-[42vh] overflow-y-auto border-b border-line bg-surface px-4 py-3">
          {tray === 'font' && (
            <>
              <Row title="Font">
                {FONT_FAMILIES.map((f) => (
                  <Chip
                    key={f.label}
                    active={curFamily === norm(f.value)}
                    style={{ fontFamily: f.value || undefined }}
                    onClick={() => (f.value ? chain().setFontFamily(f.value).run() : chain().unsetFontFamily().run())}
                  >
                    {f.label}
                  </Chip>
                ))}
              </Row>
              <Row title="Size">
                <Chip active={!curSize} onClick={() => chain().unsetFontSize().run()}>
                  Auto
                </Chip>
                {FONT_SIZES.map((s) => (
                  <Chip key={s} active={curSize === s} onClick={() => chain().setFontSize(s).run()}>
                    {parseInt(s, 10)}
                  </Chip>
                ))}
              </Row>
            </>
          )}

          {tray === 'color' && (
            <Row title="Text color">
              <Chip onClick={() => chain().unsetColor().run()}>Auto</Chip>
              {TEXT_COLORS.map((c) => (
                <Swatch
                  key={c.value}
                  color={c.value}
                  label={c.label}
                  active={curColor === c.value}
                  onClick={() => chain().setColor(c.value).run()}
                />
              ))}
            </Row>
          )}

          {tray === 'highlight' && (
            <Row title="Highlight">
              <Chip onClick={() => chain().unsetHighlight().run()}>None</Chip>
              {HIGHLIGHT_COLORS.map((c) => (
                <Swatch
                  key={c.value}
                  color={c.value}
                  label={c.label}
                  onClick={() => chain().setHighlight({ color: c.value }).run()}
                />
              ))}
            </Row>
          )}

          {tray === 'insert' && (
            <>
              <Row>
                {tile(<IconImage size={24} />, 'Image', () => imageRef.current?.click())}
                {tile(<IconMic size={24} />, 'Record', () => setRecording(true))}
                {tile(<IconMusic size={24} />, 'Audio', () => audioRef.current?.click())}
                {tile(<IconTable size={24} />, 'Table', () =>
                  chain().insertTable({ rows: 3, cols: 3, withHeaderRow: false }).run(),
                )}
                {tile(<IconDivider size={24} />, 'Divider', () => chain().setHorizontalRule().run())}
              </Row>
              {inTable && (
                <Row title="Table">
                  <Chip onClick={() => chain().addRowAfter().run()}>+ Row</Chip>
                  <Chip onClick={() => chain().addColumnAfter().run()}>+ Column</Chip>
                  <Chip onClick={() => chain().deleteRow().run()}>− Row</Chip>
                  <Chip onClick={() => chain().deleteColumn().run()}>− Column</Chip>
                  <Chip onClick={() => chain().deleteTable().run()}>Delete table</Chip>
                </Row>
              )}
            </>
          )}

          {tray === 'page' && (
            <>
              <Row title="Page color">
                {Object.entries(PAGE_COLORS).map(([key, c]) => (
                  <Swatch
                    key={key}
                    color={c.light}
                    label={c.label}
                    active={(page.pageColor || 'none') === key}
                    onClick={() => onPageSettings({ pageColor: key })}
                  />
                ))}
              </Row>
              <Row title="Lines">
                {RULE_STYLES.map((r) => (
                  <Chip
                    key={r.key}
                    active={(page.ruleStyle || 'none') === r.key}
                    onClick={() => onPageSettings({ ruleStyle: r.key })}
                  >
                    {r.label}
                  </Chip>
                ))}
              </Row>
              <button
                type="button"
                onClick={onDeletePage}
                className="mt-1 flex items-center gap-2 rounded-xl px-1 py-2 text-sm text-red-500"
              >
                <IconTrash size={18} />
                Delete this page
              </button>
            </>
          )}
        </div>
      )}

      <div className="flex items-center">
        <div className="no-scrollbar flex flex-1 items-center gap-0.5 overflow-x-auto px-2 py-1.5">
          <Tb label="Undo" onClick={() => chain().undo().run()}>
            <IconUndo />
          </Tb>
          <Tb label="Redo" onClick={() => chain().redo().run()}>
            <IconRedo />
          </Tb>
          <Sep />
          <Tb label="Font and size" wide active={tray === 'font'} onClick={() => toggleTray('font')}>
            <span className="font-semibold">Aa</span>
          </Tb>
          <Sep />
          <Tb label="Bold" active={editor.isActive('bold')} onClick={() => chain().toggleBold().run()}>
            <b>B</b>
          </Tb>
          <Tb label="Italic" active={editor.isActive('italic')} onClick={() => chain().toggleItalic().run()}>
            <i className="font-serif">I</i>
          </Tb>
          <Tb label="Underline" active={editor.isActive('underline')} onClick={() => chain().toggleUnderline().run()}>
            <u>U</u>
          </Tb>
          <Tb label="Strikethrough" active={editor.isActive('strike')} onClick={() => chain().toggleStrike().run()}>
            <s>S</s>
          </Tb>
          <Tb
            label="Heading"
            active={editor.isActive('heading', { level: 2 })}
            onClick={() => chain().toggleHeading({ level: 2 }).run()}
          >
            <span className="font-bold">H</span>
          </Tb>
          <Sep />
          <Tb label="Text color" active={tray === 'color'} onClick={() => toggleTray('color')}>
            <span className="font-bold leading-none" style={{ borderBottom: `3px solid ${curColor || 'currentColor'}` }}>
              A
            </span>
          </Tb>
          <Tb label="Highlight" active={tray === 'highlight'} onClick={() => toggleTray('highlight')}>
            <span className="rounded px-1.5 font-bold" style={{ background: '#fff176', color: '#1a1a1a' }}>
              H
            </span>
          </Tb>
          <Sep />
          <Tb label="Bullet list" active={editor.isActive('bulletList')} onClick={() => chain().toggleBulletList().run()}>
            <IconBullet />
          </Tb>
          <Tb label="Numbered list" active={editor.isActive('orderedList')} onClick={() => chain().toggleOrderedList().run()}>
            <IconNumber />
          </Tb>
          <Tb label="To-do list" active={editor.isActive('taskList')} onClick={() => chain().toggleTaskList().run()}>
            <IconCheck />
          </Tb>
          <Sep />
          <Tb label="Insert" active={tray === 'insert'} onClick={() => toggleTray('insert')}>
            <IconPlus />
          </Tb>
          <Tb label="Page style" active={tray === 'page'} onClick={() => toggleTray('page')}>
            <IconPage />
          </Tb>
        </div>
        {keyboard && (
          <button
            type="button"
            aria-label="Hide keyboard"
            onMouseDown={keepFocus}
            onClick={() => {
              setTray(null)
              editor.commands.blur()
            }}
            className="mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-l border-line text-muted"
          >
            <IconKeyboardDown />
          </button>
        )}
      </div>

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
