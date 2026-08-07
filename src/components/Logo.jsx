// Lamsa brand mark + wordmark as scalable inline SVG.
// Mark: NFC waves inside a cobalt gradient tile. Wordmark uses a cyan accent dot.
export default function Logo({ markSize = 36, light = true, showText = true }) {
  return (
    <span className="brand" style={light ? { color: '#fff' } : undefined}>
      <Mark size={markSize} />
      {showText && (
        <span style={{ fontFamily: "var(--font-body)", fontWeight: 900, letterSpacing: '0.3px', fontSize: `calc(${markSize}px * 0.72)` }}>
          Lam<span className="dot">sa</span>
        </span>
      )}
    </span>
  )
}

function Mark({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="lamsaGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#1854E8" />
          <stop offset="1" stopColor="#15D8F2" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="13" fill="url(#lamsaGrad)" />
      <path
        d="M13 18c7.5 0 13.5 6 13.5 13.5"
        stroke="#FFFFFF" strokeOpacity="0.95" strokeWidth="3.4" strokeLinecap="round"
      />
      <path
        d="M20 18c4 0 7 3 7 7"
        stroke="#FFFFFF" strokeOpacity="0.7" strokeWidth="3.4" strokeLinecap="round"
      />
      <circle cx="29" cy="31" r="2.6" fill="#fff" />
    </svg>
  )
}