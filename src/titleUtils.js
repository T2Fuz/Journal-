// If a page has no explicit title, we show the first few words of its
// content instead (like a label), but the page itself has no stored title.
export function stripHtml(html) {
  if (!html) return ''
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function deriveTitle(html, maxWords = 6) {
  const text = stripHtml(html)
  if (!text) return 'Untitled'
  const words = text.split(' ')
  const short = words.slice(0, maxWords).join(' ')
  return words.length > maxWords ? short + '…' : short
}
