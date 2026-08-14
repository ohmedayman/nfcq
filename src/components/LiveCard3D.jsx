import React, { useState, useRef } from 'react'
import { NfcIcon } from './icons'

export default function LiveCard3D({
  productName = 'Lamsa Smart NFC Card',
  material = 'metal', // 'metal' | 'carbon' | 'matte' | 'wood' | 'gold'
  customType = 'none', // 'none' | 'print' | 'laser'
  customName = '',
  customRole = '',
  logoUrl = null,
  fontStyle = 'modern', // 'modern' | 'luxury' | 'english' | 'tech'
  color = '#0c1830',
  isAr = true,
}) {
  const cardRef = useRef(null)
  const [rotate, setRotate] = useState({ x: 0, y: 0 })
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 })
  const [isFlipped, setIsFlipped] = useState(false)

  function handleMouseMove(e) {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateX = ((y - centerY) / centerY) * -14
    const rotateY = ((x - centerX) / centerX) * 14
    setRotate({ x: rotateX, y: rotateY })
    setGlare({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.6,
    })
  }

  function handleMouseLeave() {
    setRotate({ x: 0, y: 0 })
    setGlare({ x: 50, y: 50, opacity: 0 })
  }

  const fontFamilies = {
    modern: `'Cairo', 'Tajawal', sans-serif`,
    luxury: `'Amiri', 'Traditional Arabic', serif`,
    english: `'Outfit', 'Inter', sans-serif`,
    tech: `'Courier New', monospace`,
  }

  // Material gradients and textures
  const materialStyles = {
    metal: {
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #090d16 100%)',
      border: '1.5px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 20px 40px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.3)',
    },
    carbon: {
      background: 'radial-gradient(black 15%, transparent 16%) 0 0, radial-gradient(black 15%, transparent 16%) 8px 8px, radial-gradient(rgba(255,255,255,.1) 15%, transparent 20%) 0 1px, radial-gradient(rgba(255,255,255,.1) 15%, transparent 20%) 8px 9px, #121212',
      backgroundSize: '16px 16px',
      border: '1.5px solid rgba(255, 255, 255, 0.15)',
      boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
    },
    gold: {
      background: 'linear-gradient(135deg, #1c1917 0%, #292524 50%, #451a03 100%)',
      border: '1.5px solid rgba(251, 191, 36, 0.4)',
      boxShadow: '0 20px 40px rgba(217, 119, 6, 0.25)',
    },
    matte: {
      background: 'linear-gradient(135deg, #18181b 0%, #27272a 100%)',
      border: '1.5px solid rgba(255, 255, 255, 0.15)',
      boxShadow: '0 20px 40px rgba(0,0,0,0.35)',
    },
  }

  const mat = materialStyles[material] || materialStyles.metal

  return (
    <div style={{ perspective: 1000, margin: '14px auto', maxWidth: 420, width: '100%', userSelect: 'none' }}>
      {/* Interactive 3D Card Container */}
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={() => setIsFlipped(!isFlipped)}
        style={{
          width: '100%',
          aspectRatio: '1.586 / 1',
          borderRadius: 22,
          position: 'relative',
          transformStyle: 'preserve-3d',
          transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y + (isFlipped ? 180 : 0)}deg)`,
          transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          cursor: 'pointer',
          ...mat,
        }}
      >
        {/* Specular Dynamic Glare Reflection */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 22,
            background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 60%)`,
            opacity: glare.opacity,
            pointerEvents: 'none',
            transition: 'opacity 0.25s ease',
            zIndex: 10,
          }}
        />

        {/* ================= FRONT FACE ================= */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            padding: '24px 26px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backfaceVisibility: 'hidden',
            color: '#ffffff',
            borderRadius: 22,
          }}
        >
          {/* Top Bar: NFC Chip & Brand / Logo */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 44,
                  height: 32,
                  borderRadius: 6,
                  background: 'linear-gradient(135deg, #fde047 0%, #d97706 100%)',
                  border: '1px solid rgba(255,255,255,0.4)',
                  boxShadow: '0 2px 8px rgba(217, 119, 6, 0.4)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{ position: 'absolute', inset: 3, border: '1px solid rgba(0,0,0,0.25)', borderRadius: 3 }} />
                <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'rgba(0,0,0,0.25)' }} />
              </div>
              <NfcIcon size={20} />
            </div>

            {logoUrl ? (
              <img src={logoUrl} alt="Custom Logo" style={{ height: 32, maxWidth: 90, objectFit: 'contain', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))' }} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 900, letterSpacing: 1.5, background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  LAMSA
                </span>
                <span style={{ fontSize: '0.65rem', background: '#fde047', color: '#0f172a', fontWeight: 900, padding: '2px 6px', borderRadius: 4 }}>
                  NFC
                </span>
              </div>
            )}
          </div>

          {/* Center / Bottom: Custom Engraved Name & Role */}
          <div style={{ marginTop: 'auto' }}>
            {customType !== 'none' ? (
              <div>
                <div
                  style={{
                    fontSize: '1.35rem',
                    fontWeight: 900,
                    fontFamily: fontFamilies[fontStyle] || fontFamilies.modern,
                    letterSpacing: 0.5,
                    marginBottom: 4,
                    color: customType === 'laser' ? '#fbbf24' : '#67e8f9',
                    textShadow: customType === 'laser'
                      ? '0 0 12px rgba(251, 191, 36, 0.6), 0 1px 2px rgba(0,0,0,0.8)'
                      : '0 0 12px rgba(6, 182, 212, 0.6)',
                  }}
                >
                  {customName || (isAr ? 'اسمك هنا بدقة متناهية' : 'YOUR NAME HERE')}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                  {customRole || (customType === 'laser' ? (isAr ? '⚡️ حفر ليزر دائم بدقة الألياف البصرية' : 'Laser Engraved Precision') : (isAr ? '🖨️ طباعة UV بالألوان الزاهية' : 'High-Res UV Color'))}
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'rgba(255,255,255,0.85)', letterSpacing: 1 }}>
                  {productName}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                  {isAr ? 'المس البطاقة بهاتفك لفتح البروفايل فوراً' : 'Tap to share instant digital profile'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ================= BACK FACE ================= */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            padding: '24px 26px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transform: 'rotateY(180deg)',
            backfaceVisibility: 'hidden',
            color: '#ffffff',
            borderRadius: 22,
          }}
        >
          {/* Back Top: Magnetic Strip & Hologram */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ width: '100%', height: 28, background: 'linear-gradient(90deg, #18181b, #09090b, #18181b)', borderRadius: 6, display: 'flex', alignItems: 'center', padding: '0 10px', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.4)', letterSpacing: 2 }}>#LMS-8942-NFC-V3</span>
              <div style={{ width: 14, height: 14, borderRadius: 99, background: 'linear-gradient(135deg, #06b6d4, #9333ea)', opacity: 0.8 }} />
            </div>
          </div>

          {/* Back Center: QR Code & Antenna Icon */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
            <div style={{ background: '#ffffff', padding: 6, borderRadius: 10, display: 'inline-block' }}>
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=https://lamsa.ink&format=svg&color=0c1830"
                alt="QR Code"
                style={{ width: 62, height: 62, display: 'block' }}
              />
            </div>

            <div style={{ textAlign: isAr ? 'left' : 'right' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#fde047' }}>
                {isAr ? 'مسح الكود أو اللمس' : 'Scan QR or Tap NFC'}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
                Powered by Lamsa.ink
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hint & Flip Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, padding: '0 4px', fontSize: '0.78rem', color: 'var(--muted)' }}>
        <span>🎮 {isAr ? 'حرّك الماوس لرؤية الانعكاس المعدني' : 'Move mouse to view metallic reflection'}</span>
        <button
          type="button"
          onClick={() => setIsFlipped(!isFlipped)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--cobalt)',
            fontWeight: 800,
            cursor: 'pointer',
            fontSize: '0.78rem',
            padding: 0,
          }}
        >
          🔄 {isFlipped ? (isAr ? 'عرض الوجه الأمامي' : 'View Front') : (isAr ? 'عرض الوجه الخلفي والـ QR' : 'View Back & QR')}
        </button>
      </div>
    </div>
  )
}
