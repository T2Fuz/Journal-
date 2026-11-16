import { useEffect, useRef, useState } from 'react'
import { uploadToCloudinary } from '../cloudinary.js'

const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

export default function AudioRecorder({ onClose, onDone }) {
  const [state, setState] = useState('idle') // idle | recording | recorded | uploading
  const [secs, setSecs] = useState(0)
  const [error, setError] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const recRef = useRef(null)
  const chunks = useRef([])
  const streamRef = useRef(null)
  const blobRef = useRef(null)
  const timerRef = useRef(null)

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }
  useEffect(
    () => () => {
      stopStream()
      clearInterval(timerRef.current)
    },
    [],
  )

  async function start() {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find((t) =>
        window.MediaRecorder?.isTypeSupported?.(t),
      )
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
      chunks.current = []
      rec.ondataavailable = (e) => {
        if (e.data.size) chunks.current.push(e.data)
      }
      rec.onstop = () => {
        const blob = new Blob(chunks.current, { type: rec.mimeType || mime || 'audio/webm' })
        blobRef.current = blob
        setPreviewUrl(URL.createObjectURL(blob))
        setState('recorded')
        stopStream()
      }
      rec.start()
      recRef.current = rec
      setSecs(0)
      timerRef.current = setInterval(() => setSecs((s) => s + 1), 1000)
      setState('recording')
    } catch {
      setError('Microphone chalu hoyni. Browser e microphone permission "Allow" korun.')
    }
  }

  function stop() {
    clearInterval(timerRef.current)
    recRef.current?.stop()
  }

  async function insert() {
    setState('uploading')
    setError('')
    try {
      const blob = blobRef.current
      const ext = blob.type.includes('mp4') ? 'm4a' : 'webm'
      const file = new File([blob], `audio-note.${ext}`, { type: blob.type })
      const link = await uploadToCloudinary(file, 'video')
      onDone(link)
    } catch (err) {
      setError(err.message)
      setState('recorded')
    }
  }

  const btn = 'px-4 py-2 rounded-lg text-sm font-semibold'

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-xl border border-line bg-surface text-ink p-6">
        <h2 className="font-bold text-lg mb-4">Audio note</h2>

        <p className="text-3xl font-mono mb-4">{fmt(secs)}</p>

        {state === 'recorded' && previewUrl && (
          <audio controls src={previewUrl} className="w-full mb-4" />
        )}

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

        <div className="flex flex-wrap gap-2">
          {state === 'idle' && (
            <button onClick={start} className={`${btn} bg-pink-800 text-white`}>
              ● Record
            </button>
          )}
          {state === 'recording' && (
            <button onClick={stop} className={`${btn} bg-red-600 text-white`}>
              ■ Stop
            </button>
          )}
          {state === 'recorded' && (
            <>
              <button onClick={insert} className={`${btn} bg-pink-800 text-white`}>
                Insert
              </button>
              <button
                onClick={() => {
                  setPreviewUrl('')
                  setSecs(0)
                  setState('idle')
                }}
                className={`${btn} border border-line`}
              >
                Re-record
              </button>
            </>
          )}
          {state === 'uploading' && <span className="text-sm text-muted">Upload hocche...</span>}
          {state !== 'uploading' && (
            <button
              onClick={() => {
                stopStream()
                onClose()
              }}
              className={`${btn} text-muted`}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
