import { useCallback, useEffect, useRef, useState } from 'react'
import { auth } from './firebase.js'

export const DICTATION_LANGS = [
  { code: 'bn-BD', label: 'বাংলা' },
  { code: 'en-US', label: 'English' },
  { code: 'ai', label: 'বাংলা + English (AI)' },
]

// recording -> 16 kHz mono WAV (small and understood by the AI)
async function toWav16k(blob) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)()
  const audio = await ctx.decodeAudioData(await blob.arrayBuffer())
  ctx.close()
  const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext
  const off = new OAC(1, Math.max(1, Math.ceil(audio.duration * 16000)), 16000)
  const src = off.createBufferSource()
  src.buffer = audio
  src.connect(off.destination)
  src.start()
  const f = (await off.startRendering()).getChannelData(0)
  const out = new DataView(new ArrayBuffer(44 + f.length * 2))
  const str = (o, t) => [...t].forEach((c, i) => out.setUint8(o + i, c.charCodeAt(0)))
  str(0, 'RIFF')
  out.setUint32(4, 36 + f.length * 2, true)
  str(8, 'WAVEfmt ')
  out.setUint32(16, 16, true)
  out.setUint16(20, 1, true)
  out.setUint16(22, 1, true)
  out.setUint32(24, 16000, true)
  out.setUint32(28, 32000, true)
  out.setUint16(32, 2, true)
  out.setUint16(34, 16, true)
  str(36, 'data')
  out.setUint32(40, f.length * 2, true)
  for (let i = 0; i < f.length; i++) {
    const v = Math.max(-1, Math.min(1, f[i]))
    out.setInt16(44 + i * 2, v < 0 ? v * 0x8000 : v * 0x7fff, true)
  }
  return out.buffer
}

const Recognition = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null

// Speech -> text, typed at the cursor of whichever block is being edited.
// Uses the browser's own speech recognition (free, needs internet).
export function useDictation(editor) {
  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState('')
  const [error, setError] = useState('')
  const [lang, setLangState] = useState(() => localStorage.getItem('journal-dict-lang') || 'bn-BD')
  const edRef = useRef(editor)
  edRef.current = editor
  const recRef = useRef(null)
  const wantRef = useRef(false)
  const langRef = useRef(lang)
  langRef.current = lang
  const [pending, setPending] = useState(0)
  const [secs, setSecs] = useState(0)
  const ai = useRef({ rec: null, stream: null, cap: null, tick: null, t0: 0, queue: Promise.resolve() })

  const insert = useCallback((raw) => {
    const ed = edRef.current
    const text = raw.trim()
    if (!ed || ed.isDestroyed || !text) return
    const { from } = ed.state.selection
    const before = from > 1 ? ed.state.doc.textBetween(from - 1, from, '\n', ' ') : ''
    const prefix = before && !/\s/.test(before) ? ' ' : ''
    ed.chain().focus().insertContent(prefix + text).run()
  }, [])

  const stop = useCallback(() => {
    wantRef.current = false
    recRef.current?.stop()
    if (ai.current.rec && ai.current.rec.state === 'recording') ai.current.rec.stop()
    clearInterval(ai.current.tick)
    setListening(false)
    setInterim('')
  }, [])

  // ---- "AI" mode: record, then send to /api/transcribe when I press Stop ----
  const sendToAI = useCallback(
    (blob) => {
      if (blob.size < 3000) return // basically silence
      setPending((n) => n + 1)
      ai.current.queue = ai.current.queue.then(async () => {
        try {
          const wav = await toWav16k(blob)
          const token = await auth.currentUser.getIdToken()
          const res = await fetch('/api/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/octet-stream', Authorization: `Bearer ${token}` },
            body: wav,
          })
          const data = await res.json().catch(() => ({}))
          if (!res.ok) throw new Error(data.error || 'Transcribe hoyni')
          insert(data.text || '')
        } catch (e) {
          setError(e.message || 'Transcribe hoyni')
        } finally {
          setPending((n) => n - 1)
        }
      })
    },
    [insert],
  )

  const recordChunk = useCallback(
    (stream) => {
      const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find((t) => window.MediaRecorder?.isTypeSupported?.(t))
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
      const chunks = []
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data)
      rec.onstop = () => {
        clearTimeout(ai.current.cap)
        const blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' })
        if (wantRef.current) recordChunk(stream) // hit the 2-minute limit: carry on
        else stream.getTracks().forEach((t) => t.stop())
        sendToAI(blob)
      }
      rec.start()
      ai.current.rec = rec
      ai.current.t0 = Date.now()
      ai.current.cap = setTimeout(() => rec.state === 'recording' && rec.stop(), 115000)
    },
    [sendToAI],
  )

  const startAI = useCallback(async () => {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      wantRef.current = true
      recordChunk(stream)
      setListening(true)
      setSecs(0)
      clearInterval(ai.current.tick)
      ai.current.tick = setInterval(() => setSecs(Math.floor((Date.now() - ai.current.t0) / 1000)), 500)
    } catch {
      setError('Microphone er permission lagbe (browser/phone settings e allow korun).')
    }
  }, [recordChunk])

  const start = useCallback(() => {
    if (langRef.current === 'ai') return startAI()
    if (!Recognition) return
    setError('')
    wantRef.current = true
    const rec = new Recognition()
    rec.lang = langRef.current
    rec.continuous = true
    rec.interimResults = true
    rec.onresult = (e) => {
      let live = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]
        if (r.isFinal) insert(r[0].transcript)
        else live += r[0].transcript
      }
      setInterim(live)
    }
    rec.onerror = (e) => {
      if (e.error === 'no-speech' || e.error === 'aborted') return
      wantRef.current = false
      setError(
        e.error === 'not-allowed' || e.error === 'service-not-allowed'
          ? 'Microphone er permission lagbe (browser/phone settings e allow korun).'
          : e.error === 'network'
            ? 'Internet lagbe.'
            : `Dictation e somoshha: ${e.error}`,
      )
    }
    rec.onend = () => {
      setInterim('')
      // browsers stop by themselves after a pause: keep going until I press stop
      if (wantRef.current) {
        try {
          rec.start()
          return
        } catch {
          /* fall through */
        }
      }
      setListening(false)
    }
    recRef.current = rec
    try {
      rec.start()
      setListening(true)
    } catch (err) {
      setError(err.message)
    }
  }, [insert, startAI])

  const toggle = useCallback(() => (wantRef.current ? stop() : start()), [start, stop])

  const setLang = (code) => {
    setLangState(code)
    try {
      localStorage.setItem('journal-dict-lang', code)
    } catch {
      /* ignore */
    }
    if (wantRef.current) {
      // switching language while listening: stop first, then press start again
      stop()
    }
  }

  useEffect(
    () => () => {
      wantRef.current = false
      recRef.current?.abort()
      clearInterval(ai.current.tick)
      if (ai.current.rec && ai.current.rec.state === 'recording') ai.current.rec.stop()
    },
    [],
  )

  const mm = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`
  const isAI = lang === 'ai'
  const live = isAI ? (listening ? `Recording ${mm}` : '') + (pending ? ' · Processing...' : '') : interim
  return {
    supported: isAI ? !!window.MediaRecorder : !!Recognition,
    listening,
    busy: listening || pending > 0,
    interim: live,
    isAI,
    error,
    lang,
    setLang,
    toggle,
    stop,
  }
}
