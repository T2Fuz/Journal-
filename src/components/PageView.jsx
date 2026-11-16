import { useEffect, useRef, useState } from 'react'

// Remember: App.jsx gives this component key={page.id}, so switching pages
// builds a fresh PageView (fresh typing state) each time.
export default function PageView({ page, dateLabel, onSave, onDelete }) {
  const [title, setTitle] = useState(page.title)
  const [content, setContent] = useState(page.content)
  const titleRef = useRef(null)
  const contentRef = useRef(null)
  const latest = useRef({})
  latest.current = { title, content, page }

  // Change coming from ANOTHER device -> show it, but never while I'm typing here.
  useEffect(() => {
    if (document.activeElement !== titleRef.current) setTitle(page.title)
  }, [page.title])
  useEffect(() => {
    if (document.activeElement !== contentRef.current) setContent(page.content)
  }, [page.content])

  // Auto-save 0.6s after I stop typing.
  useEffect(() => {
    if (title === page.title && content === page.content) return
    const t = setTimeout(() => onSave(page.id, { title, content }), 600)
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

  return (
    <main className="flex-1 p-10 min-w-0">
      <input
        ref={titleRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className="w-full text-3xl font-bold mb-1 bg-transparent outline-none"
      />
      <p className="text-xs text-muted mb-6">{dateLabel}</p>
      <div className="border border-line rounded-lg p-5">
        <textarea
          ref={contentRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start writing..."
          className="w-full min-h-[50vh] bg-transparent outline-none resize-y text-ink leading-relaxed"
        />
      </div>
      <button
        onClick={() => {
          if (window.confirm('Ei page ta delete korben?')) onDelete(page.id)
        }}
        className="mt-6 text-xs text-muted underline"
      >
        Delete this page
      </button>
    </main>
  )
}
