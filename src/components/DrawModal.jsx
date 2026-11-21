import { useEffect, useRef, useState } from 'react'

const COLORS = ['#111111', '#e03131', '#1971c2', '#2f9e44', '#f08c00', '#9c36b5', '#868e96']
const SIZES = [2, 4, 8]

// Full-screen sketch pad. Finger, mouse or Apple Pencil all work.
// "Insert" turns the drawing into a picture and hands it to onSave(blob).
export default function DrawModal({ onSave, onClose }) {
  const wrapRef = useRef(null)
  const canvasRef = useRef(null)
  const strokes = useRef([]) // { color, size, erase, pts: [{x,y,p}] }
  const current = useRef(null)
  const [tool, setTool] = useState('pen')
  const [color, setColor] = useState(COLORS[0])
  const [size, setSize] = useState(SIZES[1])
  const [count, setCount] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const dims = useRef({ w: 0, h: 0, dpr: 1 })

  const ctx = () => canvasRef.current.getContext('2d')

  function paintSegment(c, s, a, b) {
    c.strokeStyle = s.erase ? '#ffffff' : s.color
    c.lineWidth = (s.erase ? s.size * 3 : s.size) * (0.5 + (b.p ?? 0.5))
    c.lineCap = 'round'
    c.lineJoin = 'round'
    c.beginPath()
    c.moveTo(a.x, a.y)
    c.lineTo(b.x, b.y)
    c.stroke()
  }

  function redraw() {
    const c = ctx()
    const { w, h } = dims.current
    c.fillStyle = '#ffffff'
    c.fillRect(0, 0, w, h)
    for (const s of strokes.current) {
      if (s.pts.length === 1) paintSegment(c, s, s.pts[0], { ...s.pts[0], x: s.pts[0].x + 0.01 })
      for (let i = 1; i < s.pts.length; i++) paintSegment(c, s, s.pts[i - 1], s.pts[i])
    }
  }

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    const dpr = window.devicePixelRatio || 1
    const w = wrap.clientWidth
    const h = wrap.clientHeight
    dims.current = { w, h, dpr }
    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    ctx().setTransform(dpr, 0, 0, dpr, 0, 0)
    redraw()
  }, [])

  const point = (e) => {
    const r = canvasRef.current.getBoundingClientRect()
    // a mouse reports 0.5 pressure while pressed; a pen gives real pressure
    return { x: e.clientX - r.left, y: e.clientY - r.top, p: e.pointerType === 'pen' && e.pressure ? e.pressure : 0.5 }
  }

  function down(e) {
    e.preventDefault()
    canvasRef.current.setPointerCapture(e.pointerId)
    const s = { color, size, erase: tool === 'eraser', pts: [point(e)] }
    current.current = s
    strokes.current.push(s)
    setCount(strokes.current.length)
    paintSegment(ctx(), s, s.pts[0], { ...s.pts[0], x: s.pts[0].x + 0.01 })
  }
  function move(e) {
    const s = current.current
    if (!s) return
    const events = e.getCoalescedEvents ? e.getCoalescedEvents() : [e]
    for (const ev of events) {
      const p = point(ev)
      paintSegment(ctx(), s, s.pts[s.pts.length - 1], p)
      s.pts.push(p)
    }
  }
  const up = () => {
    current.current = null
  }

  function undo() {
    strokes.current.pop()
    setCount(strokes.current.length)
    redraw()
  }
  function clearAll() {
    strokes.current = []
    setCount(0)
    redraw()
  }

  async function save() {
    if (!strokes.current.length) return
    // crop away the empty paper around the drawing
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
    for (const s of strokes.current) {
      const pad = (s.erase ? s.size * 3 : s.size) * 1.5
      for (const p of s.pts) {
        x0 = Math.min(x0, p.x - pad); y0 = Math.min(y0, p.y - pad)
        x1 = Math.max(x1, p.x + pad); y1 = Math.max(y1, p.y + pad)
      }
    }
    const { w, h, dpr } = dims.current
    const m = 12
    x0 = Math.max(0, x0 - m); y0 = Math.max(0, y0 - m)
    x1 = Math.min(w, x1 + m); y1 = Math.min(h, y1 + m)
    const out = document.createElement('canvas')
    out.width = Math.max(1, Math.round((x1 - x0) * dpr))
    out.height = Math.max(1, Math.round((y1 - y0) * dpr))
    out.getContext('2d').drawImage(canvasRef.current, x0 * dpr, y0 * dpr, out.width, out.height, 0, 0, out.width, out.height)
    setBusy(true)
    setError('')
    try {
      const blob = await new Promise((res) => out.toBlob(res, 'image/png'))
      await onSave(blob)
      onClose()
    } catch (e) {
      setError(e.message || 'Save hoyni')
      setBusy(false)
    }
  }

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const tb = 'flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm active:bg-line disabled:opacity-35'
  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col bg-cream text-ink"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-between border-b border-line px-3 py-2">
        <button onClick={onClose} disabled={busy} className={tb}>
          Cancel
        </button>
        <span className="font-semibold">Drawing</span>
        <button
          onClick={save}
          disabled={!count || busy}
          className="flex h-10 items-center rounded-xl bg-pink-800 px-4 text-sm font-semibold text-white disabled:opacity-40"
        >
          {busy ? 'Saving...' : 'Insert'}
        </button>
      </div>

      <div ref={wrapRef} className="relative min-h-0 flex-1 bg-white">
        <canvas
          ref={canvasRef}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          style={{ touchAction: 'none', cursor: tool === 'eraser' ? 'cell' : 'crosshair' }}
          className="absolute inset-0"
        />
      </div>

      {error && <p className="px-4 py-1 text-xs text-red-500">{error}</p>}

      <div className="flex items-center gap-1 overflow-x-auto border-t border-line px-2 py-2" style={{ scrollbarWidth: 'none' }}>
        <button onClick={() => setTool('pen')} className={`${tb} ${tool === 'pen' ? 'bg-pink-200 text-pink-900 dark:bg-pink-900/60 dark:text-pink-100' : ''}`}>
          Pen
        </button>
        <button onClick={() => setTool('eraser')} className={`${tb} ${tool === 'eraser' ? 'bg-pink-200 text-pink-900 dark:bg-pink-900/60 dark:text-pink-100' : ''}`}>
          Eraser
        </button>
        <span className="mx-1 h-6 w-px shrink-0 bg-line" />
        {COLORS.map((c) => (
          <button
            key={c}
            aria-label={c}
            onClick={() => {
              setColor(c)
              setTool('pen')
            }}
            className={`h-8 w-8 shrink-0 rounded-full border border-line ${
              color === c && tool === 'pen' ? 'ring-2 ring-pink-600 ring-offset-2 ring-offset-[var(--c-cream)]' : ''
            }`}
            style={{ background: c }}
          />
        ))}
        <span className="mx-1 h-6 w-px shrink-0 bg-line" />
        {SIZES.map((s) => (
          <button key={s} aria-label={`size ${s}`} onClick={() => setSize(s)} className={`${tb} w-10 ${size === s ? 'bg-line' : ''}`}>
            <span className="rounded-full bg-current" style={{ width: s * 2 + 2, height: s * 2 + 2 }} />
          </button>
        ))}
        <span className="mx-1 h-6 w-px shrink-0 bg-line" />
        <button onClick={undo} disabled={!count} className={tb}>
          Undo
        </button>
        <button onClick={clearAll} disabled={!count} className={tb}>
          Clear
        </button>
      </div>
    </div>
  )
}
