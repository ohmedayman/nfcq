import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useLang } from '../context/LanguageContext'
import { fetchPublic } from '../lib/firebase'
import { CUSTOMER } from '../data/content'
import { normalizeUrl, normalizeSocialUrl } from '../lib/utils'
import Logo from '../components/Logo'
import {
  NfcIcon, IconInstagram, IconLinkedin, IconTwitter, IconWhatsApp, IconMail, IconPhone, IconLink,
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
  const { lang } = useLang()
  const isAr = lang === 'ar'
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [missing, setMissing] = useState(false)
  const [permError, setPermError] = useState(false)
  const [tapped, setTapped] = useState(false)
  const [saved, setSaved] = useState(false)

  function loadProfile() {
    setLoading(true)
    setMissing(false)
    setPermError(false)
    setTapped(false)
    setSaved(false)
    fetchPublic(uid).then((d) => {
      if (d) setData(d)
      else setMissing(true)
      setLoading(false)
    }).catch((err) => {
      console.error('[PublicNfc] fetch error:', err)
      if (err?.code === 'permission-denied') {
        setPermError(true)
      } else {
        setMissing(true)
      }
      setLoading(false)
    })
  }

  useEffect(() => {
    loadProfile()
  }, [uid])

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

  if (permError) {
    return (
      <div className="nfc-page">
        <div className="aurora" />
        <div className="container nfc-wrap" style={{ textAlign: 'center', paddingTop: 80 }}>
          <div className="nfc-missing-icon" style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <h2 style={{ color: 'var(--text)', marginBottom: 8, fontSize: '1.6rem' }}>{isAr ? 'خطأ في الوصول' : 'Access error'}</h2>
          <p style={{ color: 'var(--muted)', marginBottom: 24 }}>{isAr ? 'قواعد قاعدة البيانات لا تسمح بالقراءة العامة. يجب تحديث Firestore Security Rules.' : 'Database rules do not allow public reads. Firestore Security Rules need to be updated.'}</p>
          <button className="btn btn-primary" onClick={loadProfile}>{isAr ? 'إعادة المحاولة' : 'Retry'}</button>
        </div>
      </div>
    )
  }

  if (missing) {
    return (
      <div className="nfc-page">
        <div className="aurora" />
        <div className="container nfc-wrap" style={{ textAlign: 'center', paddingTop: 80 }}>
          <div className="nfc-missing-icon" style={{ fontSize: 48, marginBottom: 16 }}>🗂️</div>
          <h2 style={{ color: 'var(--text)', marginBottom: 8, fontSize: '1.6rem' }}>{isAr ? 'الصفحة غير موجودة' : 'Page not found'}</h2>
          <p style={{ color: 'var(--muted)', marginBottom: 24 }}>{isAr ? 'لم ينشئ هذا المستخدم صفحته بعد.' : 'This user has not set up their page yet.'}</p>
          <Link to="/" className="btn btn-primary">{isAr ? 'العودة للرئيسية' : 'Go home'}</Link>
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

  const hasSocial = profile.social?.instagram || profile.social?.linkedin || profile.social?.twitter || profile.social?.whatsapp

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
    setTimeout(() => setSaved(false), 2000)
  }

  async function shareCard() {
    const url = window.location.href
    const text = `${profile.name} — ${profile.role || ''}`
    if (navigator.share) {
      try {
        await navigator.share({ title: profile.name, text, url })
      } catch { /* cancelled */ }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(url)
      alert(isAr ? 'تم نسخ الرابط' : 'Link copied!')
    }
  }

  return (
    <div className={`nfc-page theme-${profile.theme || 'default'}`}>
      <div className="aurora" />
      <div className="container nfc-wrap">
        {/* Brand */}
        <div className={`nfc-brand ${tapped ? 'show' : ''}`}>
          <Link to="/" aria-label="home"><Logo markSize={32} light={false} /></Link>
        </div>

        <div className={`nfc-card nfc-glass ${tapped ? 'show' : ''}`}>
          {/* Cover gradient */}
          <div className="nfc-cover">
            <div className="nfc-cover-shimmer" />
            <div className="nfc-cover-pattern" />
          </div>

          {/* Avatar */}
          <div className="nfc-avatar-wrap">
            <div className="nfc-avatar">
              {profile.avatar
                ? <img src={profile.avatar} alt={profile.name} />
                : <span>{profile.name.charAt(0)}</span>}
            </div>
            <div className="nfc-avatar-ring" />
          </div>

          {/* Info */}
          <div className="nfc-body">
            <h1 className="nfc-name">{profile.name}</h1>
            {profile.role && <div className="nfc-role">{profile.role}</div>}
            {profile.bio && <p className="nfc-bio">{profile.bio}</p>}

            {/* Social icons */}
            {hasSocial && (
              <div className="nfc-socials">
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
                  <a href={normalizeSocialUrl('twitter', profile.social.twitter)} target="_blank" rel="noreferrer" aria-label="X" className="nfc-social-btn" style={{ '--sc': '#000' }}>
                    <IconTwitter />
                  </a>
                )}
                {profile.social.whatsapp && (
                  <a href={normalizeSocialUrl('whatsapp', profile.social.whatsapp)} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="nfc-social-btn" style={{ '--sc': '#25D366' }}>
                    <IconWhatsApp />
                  </a>
                )}
              </div>
            )}

            {/* Links */}
            {profile.links.length > 0 && (
              <div className="nfc-links">
                {profile.links.map((l, i) => (
                  <a
                    key={i}
                    href={normalizeUrl(l.url)}
                    className="nfc-link"
                    target="_blank"
                    rel="noreferrer"
                    style={{ animationDelay: `${i * 100}ms`, '--lc': LINK_COLORS[i % LINK_COLORS.length] }}
                  >
                    <span className="nfc-link-icon" style={{ background: LINK_COLORS[i % LINK_COLORS.length] }}>
                      {getLinkIcon(l.url)}
                    </span>
                    <span className="nfc-link-label">{l.label || l.url}</span>
                    <span className="nfc-link-arrow">{isAr ? '←' : '→'}</span>
                  </a>
                ))}
              </div>
            )}

            {/* Contact info */}
            {(profile.phone || profile.email) && (
              <div className="nfc-contact">
                {profile.phone && (
                  <a href={`tel:${profile.phone}`} className="nfc-contact-item">
                    <IconPhone /> {profile.phone}
                  </a>
                )}
                {profile.email && (
                  <a href={`mailto:${profile.email}`} className="nfc-contact-item">
                    <IconMail /> {profile.email}
                  </a>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="nfc-actions">
              <button className="nfc-action-btn nfc-action-primary" onClick={downloadVCard}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                {saved ? (isAr ? '✓ تم الحفظ' : '✓ Saved') : (isAr ? 'حفظ جهات الاتصال' : 'Save to Contacts')}
              </button>
              <button className="nfc-action-btn nfc-action-secondary" onClick={shareCard}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                {isAr ? 'مشاركة' : 'Share'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`nfc-footer ${tapped ? 'show' : ''}`}>
          <div className="nfc-powered">
            <NfcIcon /> {isAr ? 'مدعومة بـ' : 'Powered by'} <b>Lamsa</b>
          </div>
        </div>
      </div>
    </div>
  )
}
