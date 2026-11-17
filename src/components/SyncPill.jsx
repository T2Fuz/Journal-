// Small "Syncing 100%" badge (same idea as TimeLogger).
// total   = how many sections+pages exist
// pending = how many of them are still waiting to reach the server
export default function SyncPill({ total, pending, online }) {
  const percent = total === 0 ? 100 : Math.round(((total - pending) / total) * 100)
  const done = percent === 100
  const label = !online ? 'Offline' : done ? 'Synced' : `Syncing ${percent}%`
  const barColor = !online ? 'bg-stone-400' : done ? 'bg-green-500' : 'bg-amber-400'
  const barWidth = !online ? 100 : percent
  const title = !online
    ? 'Internet nei. Lekha device-e save ache, internet ashle sync hobe.'
    : done
      ? 'Shob kichu sync hoye geche'
      : `${pending} ta item server-e pathano baki`

  return (
    <div
      title={title}
      className="relative inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-xs text-ink"
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.5 19a4.5 4.5 0 1 0-1.4-8.8A6 6 0 1 0 5 14.3 4 4 0 0 0 6 19z" />
      </svg>
      <span>{label}</span>
      <span className="absolute left-3 right-3 bottom-0 h-[2px] rounded bg-line overflow-hidden">
        <span className={`block h-full ${barColor}`} style={{ width: `${barWidth}%` }} />
      </span>
    </div>
  )
}
