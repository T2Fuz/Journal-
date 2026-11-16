export default function SectionTabs({ sections, activeId, onSelect }) {
  return (
    <nav className="flex gap-1.5 flex-wrap" aria-label="Sections">
      {sections.map((s) => (
        <button
          key={s.id}
          onClick={() => onSelect(s.id)}
          className={`px-4 py-2 rounded-t-lg text-sm font-semibold ${s.color} ${
            activeId === s.id ? 'shadow-[inset_0_-3px_0_0_rgba(0,0,0,0.3)]' : ''
          }`}
        >
          {s.name}
        </button>
      ))}
      <button
        aria-label="Add section"
        className="px-3.5 py-2 rounded-lg border border-dashed border-stone-300 text-stone-400"
      >
        +
      </button>
    </nav>
  )
}
