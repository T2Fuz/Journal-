export default function PageView({ page }) {
  if (!page) return <main className="flex-1 p-10 text-muted">No page selected</main>
  return (
    <main className="flex-1 p-10 min-w-0">
      <h1 className="text-3xl font-bold mb-1">{page.title}</h1>
      <p className="text-xs text-muted mb-6">{page.date}</p>
      <div className="border border-line rounded-lg p-5 text-ink leading-relaxed">
        <p>{page.content || 'Start writing...'}</p>
      </div>
    </main>
  )
}
