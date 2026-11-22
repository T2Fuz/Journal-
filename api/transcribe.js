// Vercel serverless function: turns a recording into text with Google Gemini.
// Keeps English words in English letters and Bengali words in Bengali letters.
// Needs ONE setting on Vercel:  GEMINI_API_KEY   (optional: GEMINI_MODEL)
import { firebaseConfig } from '../src/firebaseConfig.js'

const MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite'
const MAX_BYTES = 4_400_000

const PROMPT = `Transcribe this audio exactly as spoken. The speaker mixes Bengali and English in the same sentence.
Rules:
- Write Bengali words in Bengali script.
- Write English words in English letters (Latin script), never in Bengali script. Example: "আমার কাপড় change করতে হবে".
- Do not translate anything. Do not summarize. Do not answer questions in the audio.
- Add normal punctuation. Keep the speaker's words as they are.
- If there is no clear speech, output nothing.
Output ONLY the transcript text.`

async function readBody(req) {
  if (Buffer.isBuffer(req.body)) return req.body
  const chunks = []
  for await (const c of req) chunks.push(c)
  return Buffer.concat(chunks)
}

// Only people logged in to THIS journal may use it (so nobody else burns your free quota).
async function isLoggedIn(token) {
  if (!token) return false
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseConfig.apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: token }),
  })
  return r.ok
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })
  const key = process.env.GEMINI_API_KEY
  if (!key) {
    return res
      .status(500)
      .json({ error: 'GEMINI_API_KEY set kora nai (Vercel > Settings > Environment Variables, tarpor Redeploy).' })
  }
  try {
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
    if (!(await isLoggedIn(token))) return res.status(401).json({ error: 'Login lagbe.' })

    const audio = await readBody(req)
    if (!audio.length) return res.status(400).json({ error: 'Audio pawa jayni.' })
    if (audio.length > MAX_BYTES) return res.status(413).json({ error: 'Recording onek boro (2 minute er beshi).' })

    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [
          { parts: [{ text: PROMPT }, { inlineData: { mimeType: 'audio/wav', data: audio.toString('base64') } }] },
        ],
        generationConfig: { temperature: 0 },
      }),
    })
    const data = await r.json().catch(() => ({}))
    if (!r.ok) return res.status(502).json({ error: data?.error?.message || `Gemini error ${r.status}` })
    const text = (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('').trim()
    return res.status(200).json({ text })
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Transcribe hoyni' })
  }
}
