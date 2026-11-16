// Page color: Firestore stores the key; each key has a light and a dark shade.
export const PAGE_COLORS = {
  none: { label: 'Default', light: '#ffffff', dark: '#211e1b' },
  cream: { label: 'Cream', light: '#fff8e7', dark: '#2b261c' },
  yellow: { label: 'Yellow', light: '#fffbd1', dark: '#2e2b14' },
  green: { label: 'Green', light: '#e6f6e6', dark: '#18291b' },
  blue: { label: 'Blue', light: '#e5f0ff', dark: '#172233' },
  pink: { label: 'Pink', light: '#ffe8f1', dark: '#33202a' },
  lavender: { label: 'Lavender', light: '#efe9ff', dark: '#252033' },
  gray: { label: 'Gray', light: '#eeeeee', dark: '#2a2a2a' },
}

// size = height of one line/square in px
export const RULE_STYLES = [
  { key: 'none', label: 'None' },
  { key: 'narrow', label: 'Narrow ruled', type: 'lines', size: 24 },
  { key: 'college', label: 'College ruled', type: 'lines', size: 28 },
  { key: 'standard', label: 'Standard ruled', type: 'lines', size: 34 },
  { key: 'wide', label: 'Wide ruled', type: 'lines', size: 42 },
  { key: 'grid-small', label: 'Small grid', type: 'grid', size: 20 },
  { key: 'grid-medium', label: 'Medium grid', type: 'grid', size: 28 },
  { key: 'grid-large', label: 'Large grid', type: 'grid', size: 40 },
]

export const TEXT_COLORS = [
  { label: 'Red', value: '#dc2626' },
  { label: 'Orange', value: '#ea580c' },
  { label: 'Yellow', value: '#ca8a04' },
  { label: 'Green', value: '#16a34a' },
  { label: 'Blue', value: '#2563eb' },
  { label: 'Purple', value: '#9333ea' },
  { label: 'Pink', value: '#db2777' },
  { label: 'Gray', value: '#6b7280' },
  { label: 'Black', value: '#000000' },
  { label: 'White', value: '#ffffff' },
]

export const HIGHLIGHT_COLORS = [
  { label: 'Yellow', value: '#fff176' },
  { label: 'Green', value: '#a5f3a5' },
  { label: 'Blue', value: '#9fd3ff' },
  { label: 'Pink', value: '#ffb3d1' },
  { label: 'Orange', value: '#ffcc80' },
  { label: 'Purple', value: '#d9b8ff' },
]

export const FONT_FAMILIES = [
  { label: 'Default', value: '' },
  { label: 'Serif', value: 'Georgia, serif' },
  { label: 'Monospace', value: '"Courier New", monospace' },
  { label: 'Handwriting', value: 'Caveat, cursive' },
  { label: 'Bangla', value: '"Noto Sans Bengali", sans-serif' },
]

export const FONT_SIZES = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '40px']
