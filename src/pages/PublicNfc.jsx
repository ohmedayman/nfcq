import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { fetchPublic, trackProfileView, trackLinkClick, saveLead } from '../lib/firebase'
import { CUSTOMER } from '../data/content'
import { normalizeUrl, normalizeSocialUrl, detectPlatformInfo } from '../lib/utils'
import Logo from '../components/Logo'
import {
  NfcIcon, IconInstagram, IconLinkedin, IconTwitter, IconWhatsApp, IconMail, IconPhone, IconPin,
  IconYouTube, IconFacebook, IconTikTok, IconTelegram, IconSnapchat, IconSpotify, IconDiscord,
  PlatformIcon, IconVerified, IconShare, IconCheck, IconDots, IconUser, IconZap
} from '../components/icons'

export default function PublicNfc() {
  const { uid } = useParams()
  const { user } = useAuth()
  const { lang } = useLang()
  const isAr = lang === 'ar'
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tapped, setTapped] = useState(false)
  const [saved, setSaved] = useState(false)
  const [connectOpen, setConnectOpen] = useState(false)

  function loadProfile() {
    setLoading(true)
    setTapped(false)
    setSaved(false)
    fetchPublic(uid).then((d) => {
      if (d) {
        setData(d)
        trackProfileView(d.uid || uid)
      } else {
        let found = null
        try {
          const cached = localStorage.getItem(`lamsa_profile_${uid}`)
          if (cached) found = JSON.parse(cached)
        } catch {}
        if (found) {
          setData(found)
          trackProfileView(found.uid || uid)
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
  }, [uid])

  useEffect(() => {
    if (!loading && data) {
      const t = setTimeout(() => setTapped(true), 250)
      return () => clearTimeout(t)
    }
  }, [loading, data])

  if (loading) {
    return (
      <div className="nfc-page theme-default">
        <div className="nfc-loading">
          <div className="nfc-loader" />
          <p style={{ color: '#fff', opacity: 0.7, marginTop: 12 }}>{isAr ? 'جاري فتح البطاقة الذكية…' : 'Loading NFC Card…'}</p>
        </div>
      </div>
    )
  }

  const profile = {
    name: data?.name || 'Lamsa Member',
    role: data?.role || '',
    email: data?.email || '',
    phone: data?.phone || '',
    bio: data?.bio || '',
    avatar: data?.avatar || '',
    theme: data?.theme || 'default',
    links: Array.isArray(data?.links) ? data.links : [],
    social: data?.social || {},
    uid: data?.uid || uid,
  }

  const hasSocial = Object.values(profile.social).some(Boolean)

  function downloadVCard() {
    const parts = [
      'BEGIN:VCARD',
      'VERSION:3.0',
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

  function handleLinkClick(url, label) {
    trackLinkClick(profile.uid, url, label)
  }

  return (
    <div className={`nfc-page theme-${profile.theme || 'default'}`}>
      <div className="aurora" />
      <div className="container nfc-wrap">
        {/* Brand & Top Bar */}
        <div className={`nfc-topbar-flex ${tapped ? 'show' : ''}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, width: '100%', maxWidth: 440 }}>
          <Link to="/" aria-label="home"><Logo markSize={30} light={false} /></Link>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setConnectOpen(true)} className="btn-chip" title={isAr ? 'تبادل جهات الاتصال' : 'Connect'}>
              🤝 {isAr ? 'أرسل بياناتك' : 'Connect'}
            </button>
            <button onClick={downloadVCard} className="btn-chip" title={isAr ? 'حفظ جهة الاتصال' : 'Save Contact'}>
              {saved ? <IconCheck /> : '💾'} {isAr ? (saved ? 'تم الحفظ' : 'حفظ') : (saved ? 'Saved' : 'Save')}
            </button>
            <button onClick={shareCard} className="btn-chip" title={isAr ? 'مشاركة' : 'Share'}>
              <IconShare />
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
                  <a href={normalizeSocialUrl('youtube', profile.social.youtube)} onClick={() => handleLinkClick(profile.social.youtube, 'YouTube')} target="_blank" rel="noreferrer" aria-label="YouTube" className="nfc-social-btn" style={{ '--sc': '#FF0000' }}>
                    <IconYouTube />
                  </a>
                )}
                {profile.social.facebook && (
                  <a href={normalizeSocialUrl('facebook', profile.social.facebook)} onClick={() => handleLinkClick(profile.social.facebook, 'Facebook')} target="_blank" rel="noreferrer" aria-label="Facebook" className="nfc-social-btn" style={{ '--sc': '#1877F2' }}>
                    <IconFacebook />
                  </a>
                )}
                {profile.social.tiktok && (
                  <a href={normalizeSocialUrl('tiktok', profile.social.tiktok)} onClick={() => handleLinkClick(profile.social.tiktok, 'TikTok')} target="_blank" rel="noreferrer" aria-label="TikTok" className="nfc-social-btn" style={{ '--sc': '#000000' }}>
                    <IconTikTok />
                  </a>
                )}
                {profile.social.telegram && (
                  <a href={normalizeSocialUrl('telegram', profile.social.telegram)} onClick={() => handleLinkClick(profile.social.telegram, 'Telegram')} target="_blank" rel="noreferrer" aria-label="Telegram" className="nfc-social-btn" style={{ '--sc': '#229ED9' }}>
                    <IconTelegram />
                  </a>
                )}
                {profile.social.whatsapp && (
                  <a href={normalizeSocialUrl('whatsapp', profile.social.whatsapp)} onClick={() => handleLinkClick(profile.social.whatsapp, 'WhatsApp')} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="nfc-social-btn" style={{ '--sc': '#25D366' }}>
                    <IconWhatsApp />
                  </a>
                )}
                {profile.social.instagram && (
                  <a href={normalizeSocialUrl('instagram', profile.social.instagram)} onClick={() => handleLinkClick(profile.social.instagram, 'Instagram')} target="_blank" rel="noreferrer" aria-label="Instagram" className="nfc-social-btn" style={{ '--sc': '#E4405F' }}>
                    <IconInstagram />
                  </a>
                )}
                {profile.social.linkedin && (
                  <a href={normalizeSocialUrl('linkedin', profile.social.linkedin)} onClick={() => handleLinkClick(profile.social.linkedin, 'LinkedIn')} target="_blank" rel="noreferrer" aria-label="LinkedIn" className="nfc-social-btn" style={{ '--sc': '#0A66C2' }}>
                    <IconLinkedin />
                  </a>
                )}
                {profile.social.twitter && (
                  <a href={normalizeSocialUrl('twitter', profile.social.twitter)} onClick={() => handleLinkClick(profile.social.twitter, 'Twitter')} target="_blank" rel="noreferrer" aria-label="Twitter" className="nfc-social-btn" style={{ '--sc': '#000000' }}>
                    <IconTwitter />
                  </a>
                )}
                {profile.social.snapchat && (
                  <a href={normalizeSocialUrl('snapchat', profile.social.snapchat)} onClick={() => handleLinkClick(profile.social.snapchat, 'Snapchat')} target="_blank" rel="noreferrer" aria-label="Snapchat" className="nfc-social-btn" style={{ '--sc': '#eab308' }}>
                    <IconSnapchat />
                  </a>
                )}
                {profile.social.spotify && (
                  <a href={normalizeSocialUrl('spotify', profile.social.spotify)} onClick={() => handleLinkClick(profile.social.spotify, 'Spotify')} target="_blank" rel="noreferrer" aria-label="Spotify" className="nfc-social-btn" style={{ '--sc': '#1DB954' }}>
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
                      onClick={() => handleLinkClick(l.url, l.label)}
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

            {/* Main Action Buttons Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
              <button className="nfc-action-primary" onClick={downloadVCard}>
                {saved ? '✓ تم الحفظ' : (isAr ? '💾 حفظ جهة الاتصال' : '💾 Save Contact')}
              </button>
              <button className="btn btn-ghost" onClick={() => setConnectOpen(true)} style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', borderRadius: 14, fontWeight: 800, fontSize: '0.86rem' }}>
                🤝 {isAr ? 'أرسل بياناتك لي' : 'Send Info'}
              </button>
            </div>

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

      {/* Exchange Contact Lead Modal */}
      {connectOpen && (
        <ExchangeContactModal
          isOpen={connectOpen}
          onClose={() => setConnectOpen(false)}
          profileName={profile.name}
          profileUid={profile.uid}
          isAr={isAr}
        />
      )}
    </div>
  )
}

function ExchangeContactModal({ isOpen, onClose, profileName, profileUid, isAr }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', note: '' })
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name || !form.phone) return alert(isAr ? 'يرجى إدخال اسمك ورقم هاتفك' : 'Please enter your name and phone')
    setSending(true)
    try {
      await saveLead(profileUid, form)
      setDone(true)
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch {
      alert(isAr ? 'تعذر الإرسال، حاول مجدداً' : 'Failed to send, try again')
    }
    setSending(false)
  }

  return (
    <div className="ec-modal-overlay" onClick={onClose}>
      <div className="ec-modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="ec-modal-close" onClick={onClose}>✕</button>

        {done ? (
          <div style={{ textAlign: 'center', padding: '24px 10px' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎉</div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#16a34a' }}>
              {isAr ? `تم إرسال بياناتك بنجاح إلى ${profileName} ✓` : `Your contact info has been sent to ${profileName} ✓`}
            </h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.86rem', marginTop: 8 }}>
              {isAr ? 'سيتم حفظ بياناتك والتواصل معك قريباً.' : 'They will reach out to you shortly.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ textAlign: 'center', marginBottom: 18 }}>
              <span style={{ fontSize: '2rem' }}>🤝</span>
              <h3 style={{ margin: '6px 0 2px', fontSize: '1.2rem' }}>{isAr ? 'أرسل بياناتك وتواصل معي' : 'Exchange Contact Details'}</h3>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--muted)' }}>
                {isAr ? `شارك معلوماتك مباشرة مع ${profileName}` : `Share your details directly with ${profileName}`}
              </p>
            </div>

            <div className="field" style={{ marginBottom: 10 }}>
              <label style={{ fontSize: '0.84rem' }}>{isAr ? 'اسمك بالكامل *' : 'Your Full Name *'}</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={isAr ? 'مثال: أحمد محمود' : 'e.g. Alex'}
              />
            </div>

            <div className="field" style={{ marginBottom: 10 }}>
              <label style={{ fontSize: '0.84rem' }}>{isAr ? 'رقم الهاتف / واتساب *' : 'Phone / WhatsApp *'}</label>
              <input
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="010XXXXXXXX"
                dir="ltr"
              />
            </div>

            <div className="field" style={{ marginBottom: 10 }}>
              <label style={{ fontSize: '0.84rem' }}>{isAr ? 'البريد الإلكتروني (اختياري)' : 'Email (Optional)'}</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@email.com"
                dir="ltr"
              />
            </div>

            <div className="field" style={{ marginBottom: 16 }}>
              <label style={{ fontSize: '0.84rem' }}>{isAr ? 'رسالة أو نبذة قصيرة' : 'Short Note'}</label>
              <textarea
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                rows={2}
                placeholder={isAr ? 'تشرفت بلقائك في المؤتمر…' : 'Great meeting you…'}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }} disabled={sending}>
              {sending ? (isAr ? 'جاري الإرسال…' : 'Sending…') : (isAr ? '🚀 إرسال بياناتي الآن' : '🚀 Send My Info')}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
