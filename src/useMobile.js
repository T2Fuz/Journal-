import { useEffect, useState } from 'react'

// true when the screen is phone-sized (under 768px wide)
export function useIsMobile() {
  const query = '(max-width: 767px)'
  const [mobile, setMobile] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setMobile(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return mobile
}

// Tracks the part of the screen that is actually visible (shrinks when the
// keyboard is open) so the bottom toolbar can sit right above the keyboard.
export function useVisualViewport() {
  const read = () => {
    const vv = window.visualViewport
    return {
      height: vv ? vv.height : window.innerHeight,
      offsetTop: vv ? vv.offsetTop : 0,
      keyboard: vv ? window.innerHeight - vv.height > 120 : false,
    }
  }
  const [state, setState] = useState(read)
  useEffect(() => {
    const vv = window.visualViewport
    const on = () => setState(read())
    on()
    vv?.addEventListener('resize', on)
    vv?.addEventListener('scroll', on)
    window.addEventListener('resize', on)
    return () => {
      vv?.removeEventListener('resize', on)
      vv?.removeEventListener('scroll', on)
      window.removeEventListener('resize', on)
    }
  }, [])
  return state
}
