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

// Resizable image: adds a `width` attribute + a drag handle on the bottom-right
// corner. Height is never set directly, so the browser's natural aspect-ratio
// scaling (height: auto) keeps the image from ever distorting.
const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (el) => el.style.width || el.getAttribute('width') || null,
        renderHTML: (attrs) => (attrs.width ? { style: `width: ${attrs.width}` } : {}),
      },
    }
  },
  addNodeView() {
    return ({ node, getPos, editor }) => {
      const wrapper = document.createElement('span')
      wrapper.className = 'resizable-image'

      const img = document.createElement('img')
      img.src = node.attrs.src
      if (node.attrs.alt) img.alt = node.attrs.alt
      img.style.width = node.attrs.width || '320px'

      const handle = document.createElement('span')
      handle.className = 'img-resize-handle'
      handle.addEventListener('mousedown', (e) => {
        e.preventDefault()
        e.stopPropagation()
        const startX = e.clientX
        const startWidth = img.getBoundingClientRect().width
        const onMove = (ev) => {
          const newWidth = Math.max(60, Math.round(startWidth + (ev.clientX - startX)))
          img.style.width = `${newWidth}px`
        }
        const onUp = () => {
          document.removeEventListener('mousemove', onMove)
          document.removeEventListener('mouseup', onUp)
          const pos = typeof getPos === 'function' ? getPos() : null
          if (typeof pos === 'number') {
            const current = editor.view.state.doc.nodeAt(pos)
            if (current) {
              const tr = editor.view.state.tr.setNodeMarkup(pos, undefined, {
                ...current.attrs,
                width: img.style.width,
              })
              editor.view.dispatch(tr)
            }
          }
        }
        document.addEventListener('mousemove', onMove)
        document.addEventListener('mouseup', onUp)
      })

      wrapper.appendChild(img)
      wrapper.appendChild(handle)

      return {
        dom: wrapper,
        update(updated) {
          if (updated.type.name !== 'image') return false
          img.src = updated.attrs.src
          img.style.width = updated.attrs.width || '320px'
          return true
        },
      }
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

// Always insert images/audio at the very end of the doc, then leave a fresh
// empty paragraph after them — otherwise the selection can land on the atom
// node we just inserted and the *next* insert replaces it instead of adding
// to it.
export function insertBlockAtEnd(editor, node) {
  const end = editor.state.doc.content.size
  editor.chain().focus().insertContentAt(end, node).run()
  const newEnd = editor.state.doc.content.size
  editor.chain().focus().insertContentAt(newEnd, { type: 'paragraph' }).run()
}

// Old pages (before the editor) stored plain text. Turn it into simple HTML.
export function toHtml(content) {
  if (!content) return ''
  if (/^\s*</.test(content)) return content
  const esc = content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return '<p>' + esc.replace(/\n/g, '<br>') + '</p>'
}
