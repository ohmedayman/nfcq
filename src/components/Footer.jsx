import { Link } from 'react-router-dom'
import { useLang } from '../context/LanguageContext'
import Logo from './Logo'

export default function Footer() {
  const { text, lang } = useLang()
  const isAr = lang === 'ar'
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <Logo markSize={36} light={false} />
            <p className="footer-desc">{text.footer_about}</p>
            <div className="footer-social">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/></svg>
              </a>
              <a href="https://x.com" target="_blank" rel="noreferrer" aria-label="X">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
              </a>
            </div>
          </div>

          <div className="footer-col">
            <h4>{text.nav_store}</h4>
            <Link to="/store">{isAr ? 'البطاقات' : 'Cards'}</Link>
            <Link to="/store">{isAr ? 'الأسعار' : 'Pricing'}</Link>
            <Link to="/nfc/demo">{isAr ? 'معاينة' : 'Demo'}</Link>
          </div>

          <div className="footer-col">
            <h4>{isAr ? 'الشركة' : 'Company'}</h4>
            <Link to="/">{text.nav_home}</Link>
            <Link to="/account">{text.nav_account}</Link>
            <Link to="/">{isAr ? 'من نحن' : 'About'}</Link>
          </div>

          <div className="footer-col">
            <h4>{isAr ? 'الدعم' : 'Support'}</h4>
            <Link to="/">{isAr ? 'الأسئلة الشائعة' : 'FAQ'}</Link>
            <Link to="/">{isAr ? 'تواصل معنا' : 'Contact'}</Link>
            <Link to="/">{isAr ? 'الخصوصية' : 'Privacy'}</Link>
          </div>
        </div>

        <div className="footer-bottom">
          <span>{text.footer_rights}</span>
          <span className="footer-powered">
            {isAr ? 'صُنع بـ' : 'Made with'} <span style={{ color: '#e04060' }}>♥</span> {isAr ? 'بمصر' : 'in Egypt'}
          </span>
        </div>
      </div>
    </footer>
  )
}
