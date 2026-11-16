export default function Sidebar({ pages, activeId, onSelect, onAdd }) {
  return (
    <aside className="w-64 shrink-0 border-l border-line p-4">
      <button
        onClick={onAdd}
        className="w-full bg-pink-800 text-white rounded-lg py-2.5 text-sm font-semibold mb-4 hover:bg-pink-700"
      >
        + Add Page
      </button>
      <ul className="space-y-1">
        {pages.map((p) => (
          <li key={p.id}>
            <button
              onClick={() => onSelect(p.id)}
              className={`block w-full text-left px-2.5 py-2 rounded-md text-sm truncate ${
                activeId === p.id
                  ? 'bg-pink-200 text-pink-900 font-bold dark:bg-pink-900/60 dark:text-pink-100'
                  : 'text-ink hover:bg-line'
              }`}
            >
              {p.title || 'Untitled'}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  )
}
