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
    return <div className="nfc-page"><div className="container nfc-wrap" style={{ textAlign: 'center', color: 'var(--muted)' }}>{isAr ? 'جاري فتح الصفحة…' : 'Opening page…'}</div></div>
  }

  if (missing) {
    return <div className="nfc-page"><div className="container nfc-wrap" style={{ textAlign: 'center', paddingTop: 60, color: 'var(--muted)' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🗂️</div>
      <h2 style={{ color: 'var(--white)', marginBottom: 8 }}>{isAr ? 'الصفحة غير موجودة' : 'Page not found'}</h2>
      <p style={{ marginBottom: 24 }}>{isAr ? 'لم يدفع هذا المستخدم صفحة بعد.' : 'This user has no public page yet.'}</p>
      <Link to="/" className="btn btn-primary">{isAr ? 'العودة للرئيسية' : 'Go home'}</Link>
    </div></div>
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

  return (
    <div className="nfc-page">
      <div className="aurora" />
      <div className="container nfc-wrap">
        <div style={{ marginBottom: 22 }}><Link to="/" aria-label="home"><Logo markSize={30} /></Link></div>
        <div className="nfc-card">
          <div className="nfc-cover" />
          <div className="nfc-avatar">
            {profile.avatar ? <img src={profile.avatar} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              : profile.name.charAt(0)}
          </div>
          <div className="nfc-body">
            <h1>{profile.name}</h1>
            {profile.role && <div className="nfc-role">{profile.role}</div>}
            <p className="nfc-bio">{profile.bio}</p>
            <div className="nfc-socials">
              {profile.social?.instagram && <a href={profile.social.instagram} target="_blank" rel="noreferrer" aria-label="Instagram"><IconInstagram /></a>}
              {profile.social?.linkedin && <a href={profile.social.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn"><IconLinkedin /></a>}
              {profile.social?.twitter && <a href={profile.social.twitter} target="_blank" rel="noreferrer" aria-label="X"><IconTwitter /></a>}
              {profile.social?.whatsapp && <a href={profile.social.whatsapp} target="_blank" rel="noreferrer" aria-label="WhatsApp"><IconWhatsApp /></a>}
              {!(profile.social?.instagram || profile.social?.linkedin || profile.social?.twitter || profile.social?.whatsapp) && <p style={{ color: 'var(--muted)' }}>{isAr ? 'لا سوشال ميديا بعد' : 'No socials yet'}</p>}
            </div>
            {profile.links.length > 0 && (
              <div className="nfc-links">
                {profile.links.map((l, i) => (
                  <a key={i} href={l.url || '#'} className="nfc-link" target="_blank" rel="noreferrer">
                    <IconLink /> {l.label || l.url}
                  </a>
                ))}
              </div>
            )}
            <div className="nfc-scan"><NfcIcon /> {isAr ? 'اقرأ البطاقة لمشاركة صفحتك' : 'Tap your card to share your page'}</div>
            <div className="nfc-meta">
              {profile.phone && <span><IconPhone /> {profile.phone}</span>}
              {profile.email && <span><IconMail /> {profile.email}</span>}
              {isAr && <span><IconPin /> القاهرة</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}