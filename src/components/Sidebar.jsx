export default function Sidebar({ pages, activeId, onSelect, onAdd }) {
  return (
    <aside className="w-64 shrink-0 border-l border-line p-4">
      <button
        onClick={onAdd}
        className="w-full bg-pink-800 text-white rounded-lg py-2.5 text-sm font-semibold mb-4"
      >
        + Add Page
      </button>
      <ul className="space-y-1">
        {pages.map((p) => (
          <li key={p.id}>
            <button
              onClick={() => onSelect(p.id)}
              className={`block w-full text-left px-2.5 py-2 rounded-md text-sm ${
                activeId === p.id
                  ? 'bg-pink-200 text-pink-900 font-bold'
                  : 'text-ink hover:bg-stone-100'
              }`}
            >
              {p.title}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  )
}
