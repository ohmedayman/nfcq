import { Link } from 'react-router-dom'
import { useLang } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import Logo from './Logo'
import { IconGlobe, IconUser, IconShield } from './icons'

export default function Navbar() {
  const { text, lang, setLang } = useLang()
  const { user, isAdmin, logout } = useAuth()
  const isAr = lang === 'ar'

  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link to="/" aria-label="home"><Logo markSize={34} /></Link>
        <nav className="nav-links">
          <Link to="/">{text.nav_home}</Link>
          <Link to="/store">{text.nav_store}</Link>
          {user
            ? <Link to="/dashboard">{isAr ? 'لوحة التحكم' : 'Dashboard'}</Link>
            : <Link to="/nfc/demo">{text.nav_nfc}</Link>}
        </nav>
        <div className="nav-right">
          <button className="lang-btn" onClick={() => setLang(l => (l === 'ar' ? 'en' : 'ar'))}>
            <IconGlobe /> {isAr ? 'English' : 'العربية'}
          </button>
          {user ? (
            <div className="nav-right" style={{ gap: 10 }}>
              {isAdmin && <Link to="/admin" className="btn btn-ghost"><IconShield /> {isAr ? 'إدارة' : 'Admin'}</Link>}
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--ice)' }}>
                {user.displayName || (user.email || '').split('@')[0]}
              </span>
              <button className="btn btn-ghost" onClick={logout}>{isAr ? 'خروج' : 'Logout'}</button>
            </div>
          ) : (
            <Link to="/account" className="btn btn-primary">
              <IconUser /> {text.nav_account}
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}