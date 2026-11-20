// Small line icons used by the mobile screens (no extra library needed).
const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}
const I = (d, extra) =>
  function Icon({ size = 20, className = '' }) {
    return (
      <svg {...base} width={size} height={size} className={className}>
        {d}
        {extra}
      </svg>
    )
  }

export const IconPlus = I(<path d="M12 5v14M5 12h14" />)
export const IconBack = I(<path d="M15 18l-6-6 6-6" />)
export const IconChevron = I(<path d="M9 18l6-6-6-6" />)
export const IconMore = I(
  <>
    <circle cx="12" cy="5" r="1.2" />
    <circle cx="12" cy="12" r="1.2" />
    <circle cx="12" cy="19" r="1.2" />
  </>,
)
export const IconUndo = I(<path d="M9 14L4 9l5-5M4 9h10a6 6 0 010 12h-3" />)
export const IconRedo = I(<path d="M15 14l5-5-5-5M20 9H10a6 6 0 000 12h3" />)
export const IconBullet = I(
  <path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />,
)
export const IconNumber = I(<path d="M10 6h11M10 12h11M10 18h11M4 5l1-1v5M3.5 15h2l-2 3h2.5" />)
export const IconCheck = I(
  <>
    <rect x="3" y="4" width="6" height="6" rx="1.2" />
    <path d="M4.3 7l1.3 1.3L8 5.8M13 7h8M13 17h8" />
    <rect x="3" y="14" width="6" height="6" rx="1.2" />
  </>,
)
export const IconImage = I(
  <>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <circle cx="9" cy="9" r="1.6" />
    <path d="M21 15l-5-5L5 21" />
  </>,
)
export const IconMic = I(
  <>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0014 0M12 18v3" />
  </>,
)
export const IconMusic = I(
  <>
    <path d="M9 18V5l11-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="17" cy="16" r="3" />
  </>,
)
export const IconTable = I(
  <>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M3 10h18M3 15h18M9 4v16M15 4v16" />
  </>,
)
export const IconDivider = I(<path d="M4 12h16M8 7h8M8 17h8" />)
export const IconPage = I(
  <>
    <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" />
    <path d="M14 3v5h5" />
  </>,
)
export const IconKeyboardDown = I(
  <>
    <rect x="2" y="4" width="20" height="12" rx="2" />
    <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h8M9 20l3 2 3-2" />
  </>,
)
export const IconBook = I(
  <>
    <path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2z" />
    <path d="M4 19a2 2 0 012-2h13" />
  </>,
)
export const IconTrash = I(
  <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />,
)
export const IconLogout = I(<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />)
export const IconUser = I(
  <>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0116 0" />
  </>,
)
