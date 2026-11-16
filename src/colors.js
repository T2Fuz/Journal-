// Firestore stores only the short key (e.g. "amber"); this maps it to Tailwind classes.
export const SECTION_COLORS = {
  amber: 'bg-amber-300 text-amber-900',
  pink: 'bg-pink-300 text-pink-900',
  stone: 'bg-stone-300 text-stone-800',
  sky: 'bg-sky-300 text-sky-900',
  green: 'bg-green-300 text-green-900',
  violet: 'bg-violet-300 text-violet-900',
  orange: 'bg-orange-300 text-orange-900',
  rose: 'bg-rose-300 text-rose-900',
}

export const COLOR_KEYS = Object.keys(SECTION_COLORS)

// Created automatically for every new account.
export const DEFAULT_SECTIONS = [
  { name: 'Lyfe', color: 'amber' },
  { name: '365 Days', color: 'pink' },
  { name: 'Delusion', color: 'stone' },
  { name: 'Business', color: 'sky' },
  { name: 'Life Lessons', color: 'green' },
]
