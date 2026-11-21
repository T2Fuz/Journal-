import { useMemo, useState } from 'react'
import mammoth from 'mammoth/mammoth.browser'
import { collection, doc, serverTimestamp, Timestamp, writeBatch } from 'firebase/firestore'
import { db } from '../firebase.js'
import { uploadToCloudinary } from '../cloudinary.js'
import { COLOR_KEYS } from '../colors.js'
import { newBlockId } from './Blocks.jsx'

// ---------- reading a OneNote .docx ----------
const WEEKDAY = /^(mon|tue|wed|thu|fri|sat|sun)[a-z]*,?\s+/i
const DATE_ONLY = /^((mon|tue|wed|thu|fri|sat|sun)[a-z]*,?\s+)?([a-z]+\s+\d{1,2},?\s+\d{4}|\d{1,2}\s+[a-z]+,?\s+\d{4}|\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4})$/i
const TIME_ONLY = /^\d{1,2}:\d{2}(:\d{2})?\s*(am|pm)?$/i

const text = (el) => (el.textContent || '').replace(/\s+/g, ' ').trim()
const isEmpty = (el) => !text(el) && !el.querySelector('img,table')
const isDateLine = (t) => t.length < 45 && DATE_ONLY.test(t)
const isTimeLine = (t) => t.length < 20 && TIME_ONLY.test(t)

function parseStamp(dateText, timeText) {
  const d = Date.parse(`${(dateText || '').replace(WEEKDAY, '')} ${timeText || ''}`.trim())
  return Number.isNaN(d) ? null : d
}

const isBreak = (e) => !!(e.matches?.('hr.pb') || e.querySelector?.('hr.pb'))
const isHeading = (e) => /^H[1-6]$/.test(e.tagName)

// A OneNote entry starts with a DATE line followed by a TIME line
// (and, if the page has a title, the title sits right above the date).
function pageStarts(els) {
  const starts = []
  const nextNonEmpty = (i) => {
    for (let k = i + 1; k < els.length && k <= i + 3; k++) if (!isEmpty(els[k])) return k
    return -1
  }
  els.forEach((e, i) => {
    if (!isDateLine(text(e))) return
    const n = nextNonEmpty(i)
    if (n < 0 || !isTimeLine(text(els[n]))) return
    let at = i
    let titled = false
    const prev = els[i - 1]
    if (
      prev &&
      !isEmpty(prev) &&
      text(prev).length <= 150 &&
      !prev.querySelector('img,table') &&
      !isDateLine(text(prev)) &&
      !isTimeLine(text(prev))
    ) {
      const before = els[i - 2]
      const boldOnly =
        prev.children.length === 1 && prev.firstElementChild.tagName === 'STRONG' && text(prev.firstElementChild) === text(prev)
      if (isHeading(prev) || boldOnly || !before || isEmpty(before) || isBreak(before)) {
        at = i - 1
        titled = true
      }
    }
    starts.push({ at, titled })
  })
  return starts
}

function splitHtml(html, mode) {
  const body = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html').body
  const els = [...body.children]
  const starts = pageStarts(els)
  const hasBreaks = els.some(isBreak)
  const hasHeads = els.some((e) => /^H[1-2]$/.test(e.tagName))
  const use =
    mode !== 'auto' ? mode : starts.length ? 'signature' : hasBreaks ? 'breaks' : hasHeads ? 'headings' : 'file'

  let groups = []
  if (use === 'signature') {
    if (starts.length && els.slice(0, starts[0].at).some((e) => !isEmpty(e))) {
      groups.push({ els: els.slice(0, starts[0].at), titled: false })
    }
    starts.forEach((st, k) => {
      const end = starts[k + 1] ? starts[k + 1].at : els.length
      groups.push({ els: els.slice(st.at, end).filter((e) => !isBreak(e)), titled: st.titled })
    })
    if (!starts.length) groups.push({ els: els.filter((e) => !isBreak(e)), titled: false })
  } else if (use === 'file') {
    groups = [{ els, titled: true }]
  } else {
    let cur = []
    els.forEach((e) => {
      const cut = (use === 'breaks' && isBreak(e)) || (use === 'headings' && /^H[1-2]$/.test(e.tagName) && cur.length)
      if (cut) {
        groups.push({ els: cur, titled: true })
        cur = []
      }
      if (!isBreak(e)) cur.push(e)
    })
    groups.push({ els: cur, titled: true })
  }
  return { groups: groups.filter((g) => g.els.some((e) => !isEmpty(e))), used: use }
}

function buildPage(group, readTitle, readDate) {
  const els = [...group.els]
  const trim = () => {
    while (els.length && isEmpty(els[0])) els.shift()
    while (els.length && isEmpty(els[els.length - 1])) els.pop()
  }
  trim()
  let title = ''
  let dateMs = null
  if (readTitle && group.titled && els.length && !isDateLine(text(els[0])) && text(els[0]).length <= 150 && !els[0].querySelector('img,table')) {
    title = text(els.shift())
  }
  trim()
  if (readDate && els.length && isDateLine(text(els[0]))) {
    let k = 1
    while (k < els.length && k <= 3 && isEmpty(els[k])) k++
    const hasTime = els[k] && isTimeLine(text(els[k]))
    dateMs = parseStamp(text(els[0]), hasTime ? text(els[k]) : '')
    if (dateMs !== null) els.splice(0, hasTime ? k + 1 : 1)
  }
  trim()
  const wrap = document.createElement('div')
  els.forEach((e) => wrap.appendChild(e.cloneNode(true)))
  return { title, dateMs, html: wrap.innerHTML }
}

async function uploadInlineImages(html, cache) {
  const body = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html').body
  let failed = 0
  for (const img of body.querySelectorAll('img[src^="data:"]')) {
    const src = img.getAttribute('src')
    try {
      if (!cache.has(src)) {
        const blob = await (await fetch(src)).blob()
        const file = new File([blob], 'onenote-image', { type: blob.type || 'image/png' })
        cache.set(src, await uploadToCloudinary(file, 'image'))
      }
      img.setAttribute('src', cache.get(src))
    } catch {
      failed++
      img.remove()
    }
  }
  return { html: body.innerHTML, failed }
}

// ---------- the window ----------
export default function ImportModal({ uid, sections, onClose }) {
  const [step, setStep] = useState('pick') // pick | preview | importing | done
  const [files, setFiles] = useState([]) // { name, html, error }
  const [mode, setMode] = useState('auto')
  const [readTitle, setReadTitle] = useState(true)
  const [readDate, setReadDate] = useState(true)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0, msg: '' })
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  async function pick(e) {
    const picked = [...(e.target.files || [])]
    e.target.value = ''
    if (!picked.length) return
    setBusy(true)
    setError('')
    const out = []
    for (const f of picked) {
      try {
        const res = await mammoth.convertToHtml(
          { arrayBuffer: await f.arrayBuffer() },
          { styleMap: ["br[type='page'] => hr.pb"] },
        )
        out.push({ name: f.name.replace(/\.docx$/i, ''), html: res.value })
      } catch {
        out.push({ name: f.name, html: '', error: 'File ta pora jaini (ta .docx to?)' })
      }
    }
    setFiles(out)
    setBusy(false)
    setStep('preview')
  }

  const parsed = useMemo(
    () =>
      files.map((f) => {
        if (f.error) return { ...f, pages: [], used: '' }
        const { groups, used } = splitHtml(f.html, mode)
        return { ...f, used, pages: groups.map((g) => buildPage(g, readTitle, readDate)) }
      }),
    [files, mode, readTitle, readDate],
  )
  const totalPages = parsed.reduce((n, f) => n + f.pages.length, 0)

  async function run() {
    if (!navigator.onLine) {
      setError('Import korte internet lagbe (chobi upload hobe).')
      return
    }
    setStep('importing')
    setError('')
    const cache = new Map()
    let done = 0
    let imgFail = 0
    let created = 0
    const taken = [...sections]
    let order = sections.reduce((m, s) => Math.max(m, s.order ?? 0), -1)
    setProgress({ done: 0, total: totalPages, msg: '' })
    try {
      for (const f of parsed) {
        if (!f.pages.length) continue
        let sec = taken.find((s) => s.name.trim().toLowerCase() === f.name.trim().toLowerCase())
        const batch0 = writeBatch(db)
        if (!sec) {
          const ref = doc(collection(db, 'users', uid, 'sections'))
          order += 1
          sec = { id: ref.id, name: f.name, color: COLOR_KEYS[order % COLOR_KEYS.length] }
          batch0.set(ref, { name: sec.name, color: sec.color, order, createdAt: serverTimestamp() })
          taken.push(sec)
        }
        await batch0.commit()

        const base = Date.now()
        for (let i = 0; i < f.pages.length; i += 8) {
          const batch = writeBatch(db)
          for (let j = i; j < Math.min(i + 8, f.pages.length); j++) {
            const p = f.pages[j]
            setProgress({ done, total: totalPages, msg: `${f.name}: ${j + 1}/${f.pages.length}` })
            const up = await uploadInlineImages(p.html, cache)
            imgFail += up.failed
            batch.set(doc(collection(db, 'users', uid, 'pages')), {
              sectionId: sec.id,
              title: p.title,
              content: up.html,
              blocks: [{ id: newBlockId(), html: up.html, color: 'none' }],
              createdAt: Timestamp.fromMillis(p.dateMs ?? base + j),
            })
            done++
            created++
          }
          await batch.commit()
        }
      }
      setResult({ pages: created, imgFail })
      setStep('done')
    } catch (e) {
      setError(e.message || 'Import hoyni.')
      setStep('preview')
    }
  }

  const label = { auto: 'Auto (recommended)', signature: 'Date + time line (OneNote style)', breaks: 'Page break', headings: 'Headings', file: 'One page per file' }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center md:items-center" onClick={step === 'importing' ? undefined : onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[92vh] w-full max-w-xl flex-col rounded-t-3xl border border-line bg-surface text-ink shadow-2xl md:rounded-2xl"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-lg font-semibold">Import from OneNote</h2>
          {step !== 'importing' && (
            <button onClick={onClose} className="text-sm text-muted underline">
              Close
            </button>
          )}
        </div>

        <div className="overflow-y-auto px-5 py-4 text-sm">
          {step === 'pick' && (
            <>
              <ol className="mb-4 list-decimal space-y-1.5 pl-5 text-muted">
                <li>Windows OneNote e section kholun</li>
                <li>File → Export → Section → Word Document (.docx)</li>
                <li>Shob section er .docx file ekhane ekshathe select korun</li>
              </ol>
              <p className="mb-4 text-xs text-muted">
                File er naam e section toiri hobe (same naam er section thakle sheta te add hobe). Chobi upload
                hote internet lagbe. Ink (haate aka), audio ar attachment ashbe na.
              </p>
              <label className="flex cursor-pointer items-center justify-center rounded-2xl bg-pink-800 py-3.5 text-base font-semibold text-white active:bg-pink-900">
                {busy ? 'Pora hocche...' : 'Choose .docx files'}
                <input type="file" multiple accept=".docx" className="hidden" onChange={pick} disabled={busy} />
              </label>
            </>
          )}

          {step === 'preview' && (
            <>
              <div className="mb-3 space-y-2">
                <label className="flex items-center justify-between gap-3">
                  <span>Page kibhabe bhag hobe</span>
                  <select value={mode} onChange={(e) => setMode(e.target.value)} className="rounded-lg border border-line bg-cream px-2 py-1.5">
                    {Object.entries(label).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={readTitle} onChange={(e) => setReadTitle(e.target.checked)} />
                  Date er upore title thakle sheta page er title (na thakle blank)
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={readDate} onChange={(e) => setReadDate(e.target.checked)} />
                  Date + time ta page er tarikh hishebe set koro
                </label>
              </div>

              <div className="space-y-3">
                {parsed.map((f, i) => (
                  <div key={i} className="rounded-xl border border-line bg-cream p-3">
                    <p className="font-semibold">
                      {f.name} <span className="font-normal text-muted">· {f.pages.length} pages</span>
                    </p>
                    {f.used && <p className="text-xs text-muted">Bhag korar niyom: {label[f.used]}</p>}
                    {f.error && <p className="text-red-500">{f.error}</p>}
                    <ul className="mt-1 space-y-0.5 text-muted">
                      {f.pages.slice(0, 4).map((p, j) => (
                        <li key={j} className="truncate">
                          {p.title || '(title nai)'}
                          {p.dateMs ? ` · ${new Date(p.dateMs).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}` : ''}
                        </li>
                      ))}
                      {f.pages.length > 4 && <li>... ar {f.pages.length - 4} ta</li>}
                    </ul>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted">
                Ager tikthik na hole upor theke mode/option bodle dekhun. Import er ageh eta shudhu preview.
                Abar import korle duplicate page hobe.
              </p>
              {error && <p className="mt-2 text-red-500">{error}</p>}
              <div className="mt-4 flex gap-2">
                <button onClick={() => setStep('pick')} className="rounded-xl border border-line px-4 py-3">
                  Back
                </button>
                <button
                  disabled={!totalPages}
                  onClick={run}
                  className="flex-1 rounded-xl bg-pink-800 py-3 font-semibold text-white disabled:opacity-40"
                >
                  Import {totalPages} pages
                </button>
              </div>
            </>
          )}

          {step === 'importing' && (
            <div className="py-6 text-center">
              <p className="mb-3 text-base font-semibold">Import hocche... bondho korben na</p>
              <div className="mx-auto h-2 w-full overflow-hidden rounded-full bg-line">
                <div className="h-full bg-pink-700 transition-all" style={{ width: `${(progress.done / Math.max(1, progress.total)) * 100}%` }} />
              </div>
              <p className="mt-2 text-muted">
                {progress.done}/{progress.total} · {progress.msg}
              </p>
            </div>
          )}

          {step === 'done' && result && (
            <div className="py-4 text-center">
              <p className="text-lg font-semibold">{result.pages} ta page import hoyeche</p>
              {result.imgFail > 0 && (
                <p className="mt-1 text-muted">{result.imgFail} ta chobi upload hoyni (baad porechhe).</p>
              )}
              <button onClick={onClose} className="mt-4 rounded-xl bg-pink-800 px-6 py-3 font-semibold text-white">
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
