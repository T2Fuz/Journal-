// Firestore stores only the short key (e.g. "amber"); this maps it to Tailwind classes.
export const SECTION_COLORS = {
  amber: 'bg-amber-300 text-amber-900 dark:bg-amber-600/80 dark:text-amber-50',
  pink: 'bg-pink-300 text-pink-900 dark:bg-pink-600/80 dark:text-pink-50',
  stone: 'bg-stone-300 text-stone-800 dark:bg-stone-600 dark:text-stone-50',
  sky: 'bg-sky-300 text-sky-900 dark:bg-sky-600/80 dark:text-sky-50',
  green: 'bg-green-300 text-green-900 dark:bg-green-600/80 dark:text-green-50',
  violet: 'bg-violet-300 text-violet-900 dark:bg-violet-600/80 dark:text-violet-50',
  orange: 'bg-orange-300 text-orange-900 dark:bg-orange-600/80 dark:text-orange-50',
  rose: 'bg-rose-300 text-rose-900 dark:bg-rose-600/80 dark:text-rose-50',
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
