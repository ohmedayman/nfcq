import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLang } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import Logo from './Logo'
import { IconGlobe, IconUser, IconShield, IconMenu, IconClose } from './icons'

export default function Navbar() {
  const { lang, setLang } = useLang()
  const { user, isAdmin, logout } = useAuth()
  const isAr = lang === 'ar'
  const [open, setOpen] = useState(false)
  const nav = useNavigate()

  const close = () => setOpen(false)
  const go = (p) => { nav(p); close() }

  const navLinks = user
    ? [{ to: '/', l: isAr ? 'الرئيسية' : 'Home' }, { to: '/store', l: isAr ? 'المتجر' : 'Store' }, { to: '/dashboard', l: isAr ? 'لوحة التحكم' : 'Dashboard' }]
    : [{ to: '/', l: isAr ? 'الرئيسية' : 'Home' }, { to: '/store', l: isAr ? 'المتجر' : 'Store' }, { to: '/nfc/demo', l: isAr ? 'بطاقتي' : 'My Card' }]

  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link to="/" aria-label="home" onClick={close} className="brand-link"><Logo markSize={34} light={false} /></Link>

        <nav className="nav-links">
          {navLinks.map((l) => <Link key={l.to} onClick={close} to={l.to}>{l.label}</Link>)}
        </nav>

        <div className="nav-right">
          <button className="lang-btn" onClick={() => setLang(l => (l === 'ar' ? 'en' : 'ar'))}>
            <IconGlobe /> <span className="lang-lbl">{isAr ? 'EN' : 'ع'}</span>
          </button>
          {user ? (
            <div className="desk-user">
              {isAdmin && <Link to="/admin" className="btn btn-ghost" onClick={close}><IconShield /> {isAr ? 'إدارة' : 'Admin'}</Link>}
              <button className="btn btn-ghost" onClick={logout}>{isAr ? 'خروج' : 'Logout'}</button>
            </div>
          ) : (
            <Link to="/account" className="btn btn-primary cta-desk" onClick={close}><IconUser /> {isAr ? 'تسجيل الدخول' : 'Sign in'}</Link>
          )}
          <button className="nav-toggle" aria-label="menu" aria-expanded={open} onClick={() => setOpen(!open)}>
            {open ? <IconClose /> : <IconMenu />}
          </button>
        </div>
      </div>

      {open && (
        <div className="mobile-menu">
          {navLinks.map((l) => <button key={l.to} className="mi" onClick={() => go(l.to)}>{l.label}</button>)}
          {user && isAdmin && <button className="mi" onClick={() => go('/admin')}><IconShield /> {isAr ? 'لوحة الإدارة' : 'Admin'}</button>}
          <button className="mi" onClick={() => setLang(l => (l === 'ar' ? 'en' : 'ar'))}><IconGlobe /> {isAr ? 'English' : 'العربية'}</button>
          {user
            ? <button className="mi mi-auth" onClick={logout}>{isAr ? 'تسجيل الخروج' : 'Logout'}</button>
            : <button className="mi mi-auth" onClick={() => go('/account')}>{isAr ? 'تسجيل الدخول / إنشاء حساب' : 'Sign in / Sign up'}</button>}
        </div>
      )}
    </header>
  )
}