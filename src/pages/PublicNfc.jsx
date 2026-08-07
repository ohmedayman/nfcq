import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useLang } from '../context/LanguageContext'
import { fetchPublic } from '../lib/firebase'
import { CUSTOMER } from '../data/content'
import Logo from '../components/Logo'
import {
  NfcIcon, IconInstagram, IconLinkedin, IconTwitter, IconWhatsApp, IconMail, IconPhone, IconPin, IconLink,
} from '../components/icons'

export default function PublicNfc() {
  const { uid } = useParams()
  const { lang } = useLang()
  const isAr = lang === 'ar'
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    let alive = true
    setLoading(true)
    fetchPublic(uid).then((d) => {
      if (!alive) return
      if (d) setData(d)
      else setMissing(true)
      setLoading(false)
    }).catch(() => { if (alive) { setMissing(true); setLoading(false) } })
    return () => { alive = false }
  }, [uid])

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

  if (missing) {
    return (
      <div className="nfc-page">
        <div className="aurora" />
        <div className="container nfc-wrap" style={{ textAlign: 'center', paddingTop: 80 }}>
          <div className="nfc-missing-icon">🗂️</div>
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
  }

  const hasSocial = profile.social?.instagram || profile.social?.linkedin || profile.social?.twitter || profile.social?.whatsapp

  return (
    <div className="nfc-page">
      <div className="aurora" />
      <div className="container nfc-wrap">
        {/* Brand */}
        <div className="nfc-brand"><Link to="/" aria-label="home"><Logo markSize={28} /></Link></div>

        <div className="nfc-card">
          {/* Cover gradient */}
          <div className="nfc-cover">
            <div className="nfc-cover-shimmer" />
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
                  <a href={profile.social.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="nfc-social-btn">
                    <IconInstagram />
                  </a>
                )}
                {profile.social.linkedin && (
                  <a href={profile.social.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn" className="nfc-social-btn">
                    <IconLinkedin />
                  </a>
                )}
                {profile.social.twitter && (
                  <a href={profile.social.twitter} target="_blank" rel="noreferrer" aria-label="X" className="nfc-social-btn">
                    <IconTwitter />
                  </a>
                )}
                {profile.social.whatsapp && (
                  <a href={profile.social.whatsapp} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="nfc-social-btn">
                    <IconWhatsApp />
                  </a>
                )}
              </div>
            )}

            {/* Links */}
            {profile.links.length > 0 && (
              <div className="nfc-links">
                {profile.links.map((l, i) => (
                  <a key={i} href={l.url || '#'} className="nfc-link" target="_blank" rel="noreferrer">
                    <span className="nfc-link-icon"><IconLink /></span>
                    <span className="nfc-link-label">{l.label || l.url}</span>
                    <span className="nfc-link-arrow">→</span>
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
          </div>
        </div>

        {/* Footer */}
        <div className="nfc-footer">
          <div className="nfc-powered">
            <NfcIcon /> {isAr ? 'مدعومة بـ' : 'Powered by'} <b>Lamsa</b>
          </div>
        </div>
      </div>
    </div>
  )
}
