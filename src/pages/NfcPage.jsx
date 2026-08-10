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
    { label: isAr ? 'أعمالي' : 'Portfolio', href: '#', icon: '💼' },
    { label: isAr ? 'السيرة الذاتية' : 'Résumé', href: '#', icon: '📄' },
    { label: isAr ? 'الحجز' : 'Booking', href: '#', icon: '📅' },
    { label: isAr ? 'موقعي' : 'Website', href: '#', icon: '🌐' },
  ]

  return (
    <div className="nfc-page">
      <div className="aurora" />
      <div className="container nfc-wrap">
        <div className="nfc-topbar">
          <Link to="/" style={{ opacity: 0.9 }}>
            <Brand light />
          </Link>
          <span className="nfc-demo-badge">{isAr ? 'معاينة' : 'Demo'}</span>
        </div>

        <div className="nfc-card nfc-card-anim">
          <div className="nfc-cover">
            <div className="nfc-cover-pattern" />
          </div>
          <div className="nfc-avatar nfc-avatar-anim">{name.charAt(0)}</div>
          <div className="nfc-body">
            <h1 className="nfc-name-anim">{name}</h1>
            <div className="nfc-role nfc-role-anim">{role}</div>
            <p className="nfc-bio">{bio}</p>

            <div className="nfc-socials nfc-socials-anim">
              <a href="#" aria-label="Instagram" className="nfc-social-link"><IconInstagram /></a>
              <a href="#" aria-label="LinkedIn" className="nfc-social-link"><IconLinkedin /></a>
              <a href="#" aria-label="Twitter" className="nfc-social-link"><IconTwitter /></a>
              <a href="#" aria-label="WhatsApp" className="nfc-social-link"><IconWhatsApp /></a>
            </div>

            <div className="nfc-links nfc-links-anim">
              {links.map((l, i) => (
                <a key={l.label} href={l.href} className="nfc-link" style={{ animationDelay: `${i * 0.1}s` }}>
                  <span className="nfc-link-icon">{l.icon}</span>
                  <span>{l.label}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </a>
              ))}
            </div>

            <div className="nfc-divider" />

            <div className="nfc-contact-info">
              <div className="nfc-contact-row">
                <IconPhone size="1em" />
                <span>+20 100 000 0000</span>
              </div>
              <div className="nfc-contact-row">
                <IconMail size="1em" />
                <span>sarah@lamsa.example</span>
              </div>
              <div className="nfc-contact-row">
                <IconPin size="1em" />
                <span>{isAr ? 'القاهرة، مصر' : 'Cairo, Egypt'}</span>
              </div>
            </div>

            <div className="nfc-scan">
              <div className="nfc-scan-pulse" />
              <NfcIcon size="1.2em" />
              <span>{isAr ? 'اضغط على البطاقة لفتح صفحتك' : 'Tap your card to share your page'}</span>
            </div>
          </div>
        </div>

        <p className="nfc-footer-text">
          {isAr ? 'هذا مثال على شكل صفحتك بعد إعدادها' : 'This is how your page looks after setup'}
        </p>
      </div>
    </div>
  )
}
