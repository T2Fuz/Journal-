export default function RecycleBin({
  trashedSections,
  trashedPages,
  onClose,
  onRestoreSection,
  onDeleteSectionForever,
  onRestorePage,
  onDeletePageForever,
}) {
  return (
    <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-surface text-ink rounded-xl shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">Recycle Bin</h2>
          <button onClick={onClose} className="text-muted text-sm">
            Close
          </button>
        </div>

        <h3 className="text-xs uppercase text-muted mb-2">Sections</h3>
        {trashedSections.length === 0 && <p className="text-sm text-muted mb-4">Kichu nei</p>}
        <ul className="space-y-1 mb-4">
          {trashedSections.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-2 text-sm px-2 py-1.5 rounded-md hover:bg-line">
              <span className="truncate">{s.name}</span>
              <span className="flex gap-3 shrink-0">
                <button className="underline" onClick={() => onRestoreSection(s.id)}>
                  Restore
                </button>
                <button
                  className="underline text-red-600"
                  onClick={() => {
                    if (
                      window.confirm(
                        `"${s.name}" section ta er shob page shoho chirotore delete korben? Eta ar ferano jabe na.`,
                      )
                    )
                      onDeleteSectionForever(s.id)
                  }}
                >
                  Delete forever
                </button>
              </span>
            </li>
          ))}
        </ul>

        <h3 className="text-xs uppercase text-muted mb-2">Pages</h3>
        {trashedPages.length === 0 && <p className="text-sm text-muted">Kichu nei</p>}
        <ul className="space-y-1">
          {trashedPages.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-2 text-sm px-2 py-1.5 rounded-md hover:bg-line">
              <span className="truncate">{p.title || 'Untitled'}</span>
              <span className="flex gap-3 shrink-0">
                <button className="underline" onClick={() => onRestorePage(p.id)}>
                  Restore
                </button>
                <button
                  className="underline text-red-600"
                  onClick={() => {
                    if (window.confirm('Ei page ta chirotore delete korben? Eta ar ferano jabe na.'))
                      onDeletePageForever(p.id)
                  }}
                >
                  Delete forever
                </button>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
