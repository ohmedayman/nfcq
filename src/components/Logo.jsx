export default function Logo({ markSize = 36, light = true, showText = true }) {
  return (
    <span className="brand" style={light ? { color: '#fff' } : undefined}>
      <img
        src="/img/logo.png"
        alt="Lamsa"
        height={markSize}
        width={markSize}
        style={{ borderRadius: markSize * 0.25, objectFit: 'contain' }}
      />
      {showText && (
        <span style={{ fontFamily: "var(--font-body)", fontWeight: 900, letterSpacing: '0.3px', fontSize: `calc(${markSize}px * 0.72)` }}>
          Lam<span className="dot">sa</span>
        </span>
      )}
    </span>
  )
}
