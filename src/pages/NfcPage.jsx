import { Link } from 'react-router-dom'
import { useLang } from '../context/LanguageContext'
import { CUSTOMER } from '../data/content'
import Brand from '../components/Brand'
import {
  NfcIcon, IconInstagram, IconLinkedin, IconTwitter, IconWhatsApp,
  IconMail, IconPhone, IconPin, IconLink,
} from '../components/icons'

export default function NfcPage() {
  const { lang } = useLang()
  const isAr = lang === 'ar'
  const name = isAr ? CUSTOMER.name : CUSTOMER.nameEn
  const role = isAr ? CUSTOMER.role : CUSTOMER.roleEn
  const bio = isAr ? CUSTOMER.bio : CUSTOMER.bioEn
  const links = [
    { label: isAr ? 'أعمالي' : 'Portfolio', href: '#', icon: 'portfolio' },
    { label: isAr ? 'السيرة الذاتية' : 'Résumé', href: '#', icon: 'resume' },
    { label: isAr ? 'الحجز' : 'Booking', href: '#', icon: 'booking' },
  ]

  return (
    <div className="nfc-page">
      <div className="container nfc-wrap">
        <div style={{ marginBottom: 22 }}>
          <Link to="/" style={{ opacity: 0.9 }}>
            <Brand light />
          </Link>
        </div>

        <div className="nfc-card">
          <div className="nfc-cover" />
          <div className="nfc-avatar">{name.charAt(0)}</div>
          <div className="nfc-body">
            <h1>{name}</h1>
            <div className="nfc-role">{role}</div>
            <p className="nfc-bio">{bio}</p>

            <div className="nfc-socials">
              <a href="#" aria-label="Instagram"><IconInstagram /></a>
              <a href="#" aria-label="LinkedIn"><IconLinkedin /></a>
              <a href="#" aria-label="Twitter"><IconTwitter /></a>
              <a href="#" aria-label="WhatsApp"><IconWhatsApp /></a>
            </div>

            <div className="nfc-links">
              {links.map((l) => (
                <a key={l.label} href={l.href} className="nfc-link">
                  <IconLink size="1.1em" /> {l.label}
                </a>
              ))}
            </div>

            <div className="nfc-scan">
              <NfcIcon size="1.2em" /> {isAr ? 'اقرأ البطاقة لمشاركة صفحتك' : 'Tap your card to share your page'}
            </div>
            <div style={{ marginTop: 16, fontSize: '0.85rem', color: 'rgba(234,242,255,0.6)' }}>
              <IconPhone size="1em" style={{ verticalAlign: '-0.15em' }} /> +20 100 000 0000 &nbsp;
              <IconMail size="1em" style={{ verticalAlign: '-0.15em' }} /> sarah@lamsa.example &nbsp;
              <IconPin size="1em" style={{ verticalAlign: '-0.15em' }} /> Cairo, EG
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}