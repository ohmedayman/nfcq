import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLang } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import Logo from './Logo'
import { IconGlobe, IconUser, IconShield, IconMenu, IconClose, IconHome } from './icons'

export default function Navbar() {
  const { lang, setLang } = useLang()
  const { user, isAdmin, logout } = useAuth()
  const isAr = lang === 'ar'
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef(null)
  const nav = useNavigate()

  const close = () => { setMobileOpen(false); setUserMenuOpen(false) }
  const go = (p) => { nav(p); close() }

  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const navLinks = user
    ? [{ to: '/', l: isAr ? 'الرئيسية' : 'Home' }, { to: '/store', l: isAr ? 'المتجر' : 'Store' }, { to: '/dashboard', l: isAr ? 'لوحة التحكم' : 'Dashboard' }]
    : [{ to: '/', l: isAr ? 'الرئيسية' : 'Home' }, { to: '/store', l: isAr ? 'المتجر' : 'Store' }, { to: '/nfc/demo', l: isAr ? 'بطاقتي' : 'My Card' }]

  const initial = (user?.displayName || user?.email || 'U').charAt(0).toUpperCase()

  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link to="/" aria-label="home" onClick={close} className="brand-link"><Logo markSize={34} light={false} showText={false} /></Link>

        <nav className="nav-links">
          {navLinks.map((l) => <Link key={l.to} onClick={close} to={l.to}>{l.label}</Link>)}
        </nav>

        <div className="nav-right">
          <button className="lang-btn" onClick={() => setLang(l => (l === 'ar' ? 'en' : 'ar'))}>
            <IconGlobe /> <span className="lang-lbl">{isAr ? 'EN' : 'ع'}</span>
          </button>

          {user ? (
            <div className="user-menu-wrap" ref={userMenuRef}>
              <button className="user-avatar-btn" onClick={() => setUserMenuOpen(!userMenuOpen)}>
                <span className="nav-avatar">{initial}</span>
                <span className="nav-user-name">{user.displayName || user.email?.split('@')[0]}</span>
                <svg className={`chevron ${userMenuOpen ? 'open' : ''}`} width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 4.5l3 3 3-3"/></svg>
              </button>
              {userMenuOpen && (
                <div className="user-dropdown">
                  <div className="ud-header">
                    <span className="ud-avatar">{initial}</span>
                    <div>
                      <div className="ud-name">{user.displayName || (user.email || '').split('@')[0]}</div>
                      <div className="ud-email">{user.email}</div>
                    </div>
                  </div>
                  <div className="ud-divider" />
                  <Link to="/dashboard" className="ud-item" onClick={close}>
                    <IconHome /> {isAr ? 'لوحة التحكم' : 'Dashboard'}
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" className="ud-item" onClick={close}>
                      <IconShield /> {isAr ? 'لوحة الإدارة' : 'Admin Panel'}
                    </Link>
                  )}
                  <Link to="/nfc/demo" className="ud-item" onClick={close}>
                    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8C10 8 16 14 16 21"/><path d="M7 8C11.5 8 15 11.5 15 16"/></svg>
                    {isAr ? 'بطاقتي' : 'My Card'}
                  </Link>
                  <div className="ud-divider" />
                  <button className="ud-item ud-logout" onClick={logout}>
                    {isAr ? 'تسجيل الخروج' : 'Sign out'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/account" className="btn btn-primary cta-desk" onClick={close}>
              <IconUser /> {isAr ? 'تسجيل الدخول' : 'Sign in'}
            </Link>
          )}

          <button className="nav-toggle" aria-label="menu" aria-expanded={mobileOpen} onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <IconClose /> : <IconMenu />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="mobile-menu">
          {navLinks.map((l) => <button key={l.to} className="mi" onClick={() => go(l.to)}>{l.label}</button>)}
          {user && isAdmin && <button className="mi" onClick={() => go('/admin')}><IconShield /> {isAr ? 'لوحة الإدارة' : 'Admin Panel'}</button>}
          <button className="mi" onClick={() => setLang(l => (l === 'ar' ? 'en' : 'ar'))}><IconGlobe /> {isAr ? 'English' : 'العربية'}</button>
          {user
            ? <button className="mi mi-auth" onClick={logout}>{isAr ? 'تسجيل الخروج' : 'Sign out'}</button>
            : <button className="mi mi-auth" onClick={() => go('/account')}>{isAr ? 'تسجيل الدخول / إنشاء حساب' : 'Sign in / Sign up'}</button>}
        </div>
      )}
    </header>
  )
}
