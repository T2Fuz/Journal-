import { Extension, Node, mergeAttributes } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import TextStyle from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import FontFamily from '@tiptap/extension-font-family'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from '@tiptap/extension-table-header'
import TableCell from '@tiptap/extension-table-cell'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'

// Image with a drag-to-resize handle (bottom-right corner). Only width is
// ever changed — height is left to "auto", so the aspect ratio can never
// get distorted.
const ResizableImage = Image.extend({
  name: 'image',
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        renderHTML: (attrs) => (attrs.width ? { style: `width: ${attrs.width}px` } : {}),
        parseHTML: (el) => {
          const w = el.style.width || el.getAttribute('width')
          return w ? parseInt(w, 10) : null
        },
      },
    }
  },
  addNodeView() {
    return ({ node, getPos, editor }) => {
      const wrapper = document.createElement('span')
      wrapper.style.cssText = 'display:inline-block;position:relative;max-width:100%;line-height:0;'

      const img = document.createElement('img')
      img.src = node.attrs.src
      img.alt = node.attrs.alt || ''
      img.style.display = 'block'
      img.style.maxWidth = '100%'
      img.style.height = 'auto'
      img.style.borderRadius = '6px'
      if (node.attrs.width) img.style.width = `${node.attrs.width}px`
      wrapper.appendChild(img)

      const handle = document.createElement('span')
      handle.setAttribute('aria-hidden', 'true')
      handle.style.cssText =
        'position:absolute;right:-5px;bottom:-5px;width:14px;height:14px;background:#8B2E6E;' +
        'border:2px solid white;border-radius:50%;cursor:nwse-resize;touch-action:none;'
      wrapper.appendChild(handle)

      let startX = 0
      let startWidth = 0

      const onMove = (e) => {
        const dx = e.clientX - startX
        const next = Math.max(60, Math.round(startWidth + dx))
        img.style.width = `${next}px`
      }
      const onUp = () => {
        document.removeEventListener('pointermove', onMove)
        document.removeEventListener('pointerup', onUp)
        if (typeof getPos === 'function') {
          const pos = getPos()
          const width = Math.round(img.getBoundingClientRect().width)
          editor.view.dispatch(
            editor.view.state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, width }),
          )
        }
      }
      handle.addEventListener('pointerdown', (e) => {
        e.preventDefault()
        e.stopPropagation()
        startX = e.clientX
        startWidth = img.getBoundingClientRect().width
        document.addEventListener('pointermove', onMove)
        document.addEventListener('pointerup', onUp)
      })

      return { dom: wrapper }
    }
  },
})

// Font size (Tiptap has no ready-made one, so this is a tiny custom extension).
const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return { types: ['textStyle'] }
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (el) => el.style.fontSize || null,
            renderHTML: (attrs) => (attrs.fontSize ? { style: `font-size: ${attrs.fontSize}` } : {}),
          },
        },
      },
    ]
  },
  addCommands() {
    return {
      setFontSize:
        (size) =>
        ({ chain }) =>
          chain().setMark('textStyle', { fontSize: size }).run(),
      unsetFontSize:
        () =>
        ({ chain }) =>
          chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run(),
    }
  },
})

// Audio player block: <audio controls src="...">
const Audio = Node.create({
  name: 'audio',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return { src: { default: null } }
  },
  parseHTML() {
    return [{ tag: 'audio[src]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['audio', mergeAttributes(HTMLAttributes, { controls: 'true' })]
  },
  addCommands() {
    return {
      setAudio:
        (src) =>
        ({ commands }) =>
          commands.insertContent({ type: 'audio', attrs: { src } }),
    }
  },
})

export function buildExtensions() {
  return [
    StarterKit,
    Underline,
    TextStyle,
    Color,
    FontFamily,
    FontSize,
    Highlight.configure({ multicolor: true }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Table.configure({ resizable: true }),
    TableRow,
    TableHeader,
    TableCell,
    ResizableImage,
    Audio,
    Placeholder.configure({ placeholder: 'Start writing...' }),
  ]
}

// Old pages (before the editor) stored plain text. Turn it into simple HTML.
export function toHtml(content) {
  if (!content) return ''
  if (/^\s*</.test(content)) return content
  const esc = content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return '<p>' + esc.replace(/\n/g, '<br>') + '</p>'
}
