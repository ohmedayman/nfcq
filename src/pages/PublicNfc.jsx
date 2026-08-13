import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { fetchPublic } from '../lib/firebase'
import { CUSTOMER } from '../data/content'
import { normalizeUrl, normalizeSocialUrl, detectPlatformInfo } from '../lib/utils'
import Logo from '../components/Logo'
import {
  NfcIcon, IconInstagram, IconLinkedin, IconTwitter, IconWhatsApp, IconMail, IconPhone, IconPin,
  IconYouTube, IconFacebook, IconTikTok, IconTelegram, IconSnapchat, IconSpotify, IconDiscord,
  PlatformIcon, IconVerified, IconShare, IconCheck, IconDots,
} from '../components/icons'

const LINK_COLORS = [
  'linear-gradient(135deg,#667eea,#764ba2)',
  'linear-gradient(135deg,#f093fb,#f5576c)',
  'linear-gradient(135deg,#4facfe,#00f2fe)',
  'linear-gradient(135deg,#43e97b,#38f9d7)',
  'linear-gradient(135deg,#fa709a,#fee140)',
  'linear-gradient(135deg,#a18cd1,#fbc2eb)',
  'linear-gradient(135deg,#fccb90,#d57eeb)',
  'linear-gradient(135deg,#e0c3fc,#8ec5fc)',
]

function getLinkIcon(url) {
  if (!url) return '🔗'
  const u = url.toLowerCase()
  if (u.includes('github')) return '💻'
  if (u.includes('linkedin')) return '💼'
  if (u.includes('instagram')) return '📸'
  if (u.includes('twitter') || u.includes('x.com')) return '🐦'
  if (u.includes('youtube')) return '🎬'
  if (u.includes('tiktok')) return '🎵'
  if (u.includes('behance') || u.includes('dribbble')) return '🎨'
  if (u.includes('medium') || u.includes('substack')) return '📝'
  if (u.includes('wa.me') || u.includes('whatsapp')) return '💬'
  if (u.includes('tel:') || u.includes('phone')) return '📞'
  if (u.includes('mailto') || u.includes('email')) return '✉️'
  if (u.includes('maps') || u.includes('location')) return '📍'
  if (u.includes('spotify')) return '🎶'
  if (u.includes('twitch')) return '🎮'
  if (u.includes('calendly') || u.includes('calendar')) return '📅'
  if (u.includes('shop') || u.includes('store') || u.includes('buy')) return '🛒'
  return '🔗'
}

export default function PublicNfc() {
  const { uid } = useParams()
  const { user } = useAuth()
  const { lang } = useLang()
  const isAr = lang === 'ar'
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tapped, setTapped] = useState(false)
  const [saved, setSaved] = useState(false)

  function loadProfile() {
    setLoading(true)
    setTapped(false)
    setSaved(false)
    fetchPublic(uid).then((d) => {
      if (d) {
        setData(d)
      } else {
        let found = null
        try {
          const cached = localStorage.getItem(`lamsa_profile_${uid}`)
          if (cached) found = JSON.parse(cached)
        } catch {}
        if (found) {
          setData(found)
        } else {
          const fallbackName = (user && user.uid === uid) ? (user.displayName || user.email?.split('@')[0]) : 'Lamsa Member'
          setData({
            name: fallbackName || 'Lamsa Member',
            role: '',
            bio: '',
            avatar: '',
            email: (user && user.uid === uid) ? user.email : '',
            phone: '',
            links: [],
            social: {},
            theme: 'default',
          })
        }
      }
      setLoading(false)
    }).catch((err) => {
      console.warn('[PublicNfc] fetch error, using resilient fallback:', err)
      const fallbackName = (user && user.uid === uid) ? (user.displayName || user.email?.split('@')[0]) : 'Lamsa Member'
      setData({
        name: fallbackName || 'Lamsa Member',
        role: '',
        bio: '',
        avatar: '',
        email: '',
        phone: '',
        links: [],
        social: {},
        theme: 'default',
      })
      setLoading(false)
    })
  }

  useEffect(() => {
    loadProfile()
  }, [uid, user])

  useEffect(() => {
    if (data) {
      const t = setTimeout(() => setTapped(true), 300)
      return () => clearTimeout(t)
    }
  }, [data])

  if (loading) {
    return (
      <div className="nfc-page">
        <div className="aurora" />
        <div className="container nfc-wrap" style={{ textAlign: 'center', paddingTop: 120 }}>
          <div className="nfc-loader" />
          <p style={{ color: 'var(--muted)', marginTop: 20 }}>{isAr ? 'جاري فتح الصفحة…' : 'Opening page…'}</p>
        </div>
      </div>
    )
  }

  const profile = {
    name: data.name || CUSTOMER.name,
    role: data.role || CUSTOMER.role,
    bio: data.bio || CUSTOMER.bio,
    avatar: data.avatar || '',
    email: data.email || '',
    phone: data.phone || '',
    links: (Array.isArray(data.links) ? data.links : []).filter((l) => l && (l.label || l.url)),
    social: data.social || {},
    theme: data.theme || 'default',
  }

  const socialKeys = ['youtube', 'facebook', 'tiktok', 'telegram', 'whatsapp', 'instagram', 'linkedin', 'twitter', 'snapchat', 'spotify']
  const hasSocial = socialKeys.some((k) => !!profile.social?.[k])

  function downloadVCard() {
    const parts = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `N:${profile.name.split(' ').slice(-1)[0] || profile.name};${profile.name.split(' ').slice(0, -1).join(' ')};;;`,
      `FN:${profile.name}`,
      profile.role ? `TITLE:${profile.role}` : '',
      profile.email ? `EMAIL;TYPE=INTERNET:${profile.email}` : '',
      profile.phone ? `TEL;TYPE=CELL:${profile.phone}` : '',
      profile.bio ? `NOTE:${profile.bio.replace(/\n/g, '\\n')}` : '',
      'END:VCARD',
    ].filter(Boolean).join('\r\n')

    const blob = new Blob([parts], { type: 'text/vcard;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${profile.name.replace(/\s+/g, '_')}.vcf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  async function shareCard() {
    const url = window.location.href
    const text = `${profile.name} — ${profile.role || 'Digital Card'}`
    if (navigator.share) {
      try {
        await navigator.share({ title: profile.name, text, url })
      } catch { /* cancelled */ }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(url)
      alert(isAr ? 'تم نسخ الرابط بنجاح ✓' : 'Link copied successfully ✓')
    }
  }

  return (
    <div className={`nfc-page theme-${profile.theme || 'default'}`}>
      <div className="aurora" />
      <div className="container nfc-wrap">
        {/* Brand & Top Bar */}
        <div className={`nfc-topbar-flex ${tapped ? 'show' : ''}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, width: '100%', maxWidth: 440 }}>
          <Link to="/" aria-label="home"><Logo markSize={30} light={false} /></Link>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={downloadVCard} className="btn-chip" title={isAr ? 'حفظ جهة الاتصال' : 'Save Contact'}>
              {saved ? <IconCheck /> : '💾'} {isAr ? (saved ? 'تم الحفظ' : 'حفظ') : (saved ? 'Saved' : 'Save')}
            </button>
            <button onClick={shareCard} className="btn-chip" title={isAr ? 'مشاركة' : 'Share'}>
              <IconShare /> {isAr ? 'مشاركة' : 'Share'}
            </button>
          </div>
        </div>

        {data && !data.activated && (
          <div style={{
            background: 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(8px)',
            color: '#f8fafc',
            padding: '8px 16px',
            borderRadius: '99px',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.8rem',
            border: '1px solid rgba(255,255,255,0.15)',
            gap: 12,
            width: '100%',
            maxWidth: 440,
          }}>
            <span>{isAr ? '✨ وضع المعاينة — اطلب بطاقتك الذكية' : '✨ Preview Mode — Order your NFC card'}</span>
            <Link to="/store" style={{ color: '#38bdf8', fontWeight: 800, textDecoration: 'underline' }}>
              {isAr ? 'اطلب الآن' : 'Order now'}
            </Link>
          </div>
        )}

        <div className={`nfc-card nfc-glass ${tapped ? 'show' : ''}`}>
          {/* Cover gradient / Hero header */}
          <div className="nfc-cover">
            <div className="nfc-cover-shimmer" />
            <div className="nfc-cover-pattern" />
          </div>

          {/* Avatar */}
          <div className="nfc-avatar-wrap">
            <div className="nfc-avatar">
              {profile.avatar
                ? <img src={profile.avatar} alt={profile.name} />
                : <span>{profile.name.charAt(0).toUpperCase()}</span>}
            </div>
            <div className="nfc-avatar-ring" />
          </div>

          {/* Info */}
          <div className="nfc-body">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <h1 className="nfc-name" style={{ margin: 0 }}>{profile.name}</h1>
              <IconVerified size="1.25em" />
            </div>
            {profile.role && <div className="nfc-role">{profile.role}</div>}
            {profile.bio && <p className="nfc-bio">{profile.bio}</p>}

            {/* Social icons row */}
            {hasSocial && (
              <div className="nfc-socials">
                {profile.social.youtube && (
                  <a href={normalizeSocialUrl('youtube', profile.social.youtube)} target="_blank" rel="noreferrer" aria-label="YouTube" className="nfc-social-btn" style={{ '--sc': '#FF0000' }}>
                    <IconYouTube />
                  </a>
                )}
                {profile.social.facebook && (
                  <a href={normalizeSocialUrl('facebook', profile.social.facebook)} target="_blank" rel="noreferrer" aria-label="Facebook" className="nfc-social-btn" style={{ '--sc': '#1877F2' }}>
                    <IconFacebook />
                  </a>
                )}
                {profile.social.tiktok && (
                  <a href={normalizeSocialUrl('tiktok', profile.social.tiktok)} target="_blank" rel="noreferrer" aria-label="TikTok" className="nfc-social-btn" style={{ '--sc': '#000000' }}>
                    <IconTikTok />
                  </a>
                )}
                {profile.social.telegram && (
                  <a href={normalizeSocialUrl('telegram', profile.social.telegram)} target="_blank" rel="noreferrer" aria-label="Telegram" className="nfc-social-btn" style={{ '--sc': '#229ED9' }}>
                    <IconTelegram />
                  </a>
                )}
                {profile.social.whatsapp && (
                  <a href={normalizeSocialUrl('whatsapp', profile.social.whatsapp)} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="nfc-social-btn" style={{ '--sc': '#25D366' }}>
                    <IconWhatsApp />
                  </a>
                )}
                {profile.social.instagram && (
                  <a href={normalizeSocialUrl('instagram', profile.social.instagram)} target="_blank" rel="noreferrer" aria-label="Instagram" className="nfc-social-btn" style={{ '--sc': '#E4405F' }}>
                    <IconInstagram />
                  </a>
                )}
                {profile.social.linkedin && (
                  <a href={normalizeSocialUrl('linkedin', profile.social.linkedin)} target="_blank" rel="noreferrer" aria-label="LinkedIn" className="nfc-social-btn" style={{ '--sc': '#0A66C2' }}>
                    <IconLinkedin />
                  </a>
                )}
                {profile.social.twitter && (
                  <a href={normalizeSocialUrl('twitter', profile.social.twitter)} target="_blank" rel="noreferrer" aria-label="X" className="nfc-social-btn" style={{ '--sc': '#000000' }}>
                    <IconTwitter />
                  </a>
                )}
                {profile.social.snapchat && (
                  <a href={normalizeSocialUrl('snapchat', profile.social.snapchat)} target="_blank" rel="noreferrer" aria-label="Snapchat" className="nfc-social-btn" style={{ '--sc': '#eab308' }}>
                    <IconSnapchat />
                  </a>
                )}
                {profile.social.spotify && (
                  <a href={normalizeSocialUrl('spotify', profile.social.spotify)} target="_blank" rel="noreferrer" aria-label="Spotify" className="nfc-social-btn" style={{ '--sc': '#1DB954' }}>
                    <IconSpotify />
                  </a>
                )}
              </div>
            )}

            {/* Smart Rich Links (Linktree Pro / Bento Style) */}
            {profile.links.length > 0 && (
              <div className="nfc-links">
                {profile.links.map((l, i) => {
                  const detected = detectPlatformInfo(l.url, l.label)
                  return (
                    <a
                      key={i}
                      href={normalizeUrl(l.url)}
                      className="nfc-rich-link"
                      target="_blank"
                      rel="noreferrer"
                      style={{ animationDelay: `${i * 80}ms` }}
                    >
                      <div className="nfc-rich-icon" style={{ background: detected.color || 'var(--cobalt)' }}>
                        <PlatformIcon name={detected.icon} />
                      </div>
                      <div className="nfc-rich-text">
                        <span className="nfc-rich-title">{l.label || l.url}</span>
                        {l.subtitle && <span className="nfc-rich-sub">{l.subtitle}</span>}
                      </div>
                      <span className="nfc-link-arrow">{isAr ? '←' : '→'}</span>
                    </a>
                  )
                })}
              </div>
            )}

            <div className="nfc-divider" />

            {/* Contact Details */}
            {(profile.phone || profile.email) && (
              <div className="nfc-contact-info">
                {profile.phone && (
                  <a href={`tel:${profile.phone}`} className="nfc-contact-row">
                    <IconPhone size="1.1em" />
                    <span>{profile.phone}</span>
                  </a>
                )}
                {profile.email && (
                  <a href={`mailto:${profile.email}`} className="nfc-contact-row">
                    <IconMail size="1.1em" />
                    <span>{profile.email}</span>
                  </a>
                )}
              </div>
            )}

            {/* Main Action Button */}
            <button className="nfc-action-primary" onClick={downloadVCard} style={{ width: '100%', marginTop: 8 }}>
              {saved ? (isAr ? 'تم حفظ جهة الاتصال ✓' : 'Contact Saved ✓') : (isAr ? '💾 حفظ جهة الاتصال في الهاتف' : '💾 Save Contact to Phone')}
            </button>

            {/* Scan Prompt */}
            <div className="nfc-scan">
              <div className="nfc-scan-pulse" />
              <NfcIcon size="1.3em" />
              <span>{isAr ? 'انقر على البطاقة لمشاركة بياناتك فورياً' : 'Tap card to share profile instantly'}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`nfc-footer ${tapped ? 'show' : ''}`} style={{ marginTop: 24, textAlign: 'center' }}>
          <div className="nfc-powered">
            <NfcIcon /> {isAr ? 'مدعوم بواسطة' : 'Powered by'} <b>Lamsa NFC</b>
          </div>
        </div>
      </div>
    </div>
  )
}
