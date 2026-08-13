import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLang } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import Logo from './Logo'
import { toast } from './Toast'
import { IconGlobe, IconUser, IconShield, IconMenu, IconClose, IconHome, IconCreditCard } from './icons'

function getCartCount() {
  try {
    const cart = JSON.parse(localStorage.getItem('lamsa_cart') || '{}')
    return Object.values(cart).reduce((s, v) => s + (v || 0), 0)
  } catch { return 0 }
}

export default function Navbar() {
  const { lang, setLang } = useLang()
  const { user, isAdmin, logout } = useAuth()
  const isAr = lang === 'ar'
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [cartCount, setCartCount] = useState(getCartCount)
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [copiedCoupon, setCopiedCoupon] = useState(false)
  const userMenuRef = useRef(null)
  const nav = useNavigate()

  // Live countdown timer
  const [timeLeft, setTimeLeft] = useState({ h: 23, m: 59, s: 59 })
  useEffect(() => {
    function calcTimeLeft() {
      const now = new Date()
      const midnight = new Date(now)
      midnight.setHours(23, 59, 59, 999)
      const diff = midnight - now
      return {
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      }
    }
    setTimeLeft(calcTimeLeft())
    const interval = setInterval(() => setTimeLeft(calcTimeLeft()), 1000)
    return () => clearInterval(interval)
  }, [])

  const close = () => { setMobileOpen(false); setUserMenuOpen(false); document.body.style.overflow = '' }
  const toggleMobile = () => {
    const next = !mobileOpen
    setMobileOpen(next)
    document.body.style.overflow = next ? 'hidden' : ''
    setUserMenuOpen(false)
  }
  const go = (p) => { nav(p); close() }

  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => setCartCount(getCartCount()), 500)
    return () => clearInterval(interval)
  }, [])

  const navLinks = user
    ? [{ to: '/', l: isAr ? 'الرئيسية' : 'Home' }, { to: '/store', l: isAr ? 'المتجر' : 'Store' }, { to: '/blog', l: isAr ? 'المدونة' : 'Blog' }, { to: '/contact', l: isAr ? 'تواصل' : 'Contact' }, { to: '/dashboard', l: isAr ? 'لوحة التحكم' : 'Dashboard' }]
    : [{ to: '/', l: isAr ? 'الرئيسية' : 'Home' }, { to: '/store', l: isAr ? 'المتجر' : 'Store' }, { to: '/blog', l: isAr ? 'المدونة' : 'Blog' }, { to: '/contact', l: isAr ? 'تواصل' : 'Contact' }, { to: '/nfc/demo', l: isAr ? 'بطاقتي' : 'My Card' }]

  const initial = (user?.displayName || user?.email || 'U').charAt(0).toUpperCase()

  function fallbackCopy(text) {
    try {
      const el = document.createElement('textarea')
      el.value = text
      el.setAttribute('readonly', '')
      el.style.position = 'absolute'
      el.style.left = '-9999px'
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    } catch {}
  }

  function copyCoupon() {
    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText('LAMSA').catch(() => {
          fallbackCopy('LAMSA')
        })
      } else {
        fallbackCopy('LAMSA')
      }
    } catch {
      fallbackCopy('LAMSA')
    }
    setCopiedCoupon(true)
    toast(isAr ? 'تم نسخ كوبون الخصم (LAMSA) بنجاح! ✓' : 'Coupon code (LAMSA) copied successfully! ✓')
    setTimeout(() => setCopiedCoupon(false), 2800)
  }

  return (
    <>
      {/* 50% OFF Announcement Banner with Live Countdown Timer & Instant Visual Copy Feedback */}
      {!bannerDismissed && (
        <div className="top-announcement-bar">
          <div className="container tab-inner">
            <div className="tab-left">
              <span className="tab-pill">🔥 {isAr ? 'عرض الإطلاق الحصري' : 'Launch Offer'}</span>
              <span className="tab-msg">
                {isAr ? (
                  <>خصم <b style={{ color: '#fde047' }}>50%</b> تلقائي على جميع البطاقات بكوبون: <code className={`tab-coupon-code ${copiedCoupon ? 'copied' : ''}`} onClick={copyCoupon} title={isAr ? 'انقر للنسخ' : 'Click to copy'}>{copiedCoupon ? '✅ LAMSA' : 'LAMSA'}</code></>
                ) : (
                  <><b style={{ color: '#fde047' }}>50% OFF</b> auto-applied with code: <code className={`tab-coupon-code ${copiedCoupon ? 'copied' : ''}`} onClick={copyCoupon}>{copiedCoupon ? '✅ LAMSA' : 'LAMSA'}</code></>
                )}
              </span>
              <div className="tab-timer-box">
                <span className="tab-timer-pulse" />
                <span className="tab-timer-text">
                  ⏳ {String(timeLeft.h).padStart(2, '0')}:{String(timeLeft.m).padStart(2, '0')}:{String(timeLeft.s).padStart(2, '0')}
                </span>
              </div>
            </div>
            <div className="tab-actions">
              <button className={`tab-copy-btn ${copiedCoupon ? 'copied' : ''}`} onClick={copyCoupon}>
                {copiedCoupon ? (isAr ? '✅ تم النسخ!' : '✅ Copied!') : (isAr ? '📋 نسخ الكوبون' : '📋 Copy Code')}
              </button>
              <Link to="/store" className="tab-shop-btn">
                🛒 {isAr ? 'شراء بالخصم' : 'Claim 50%'}
              </Link>
              <button className="tab-close-btn" onClick={() => setBannerDismissed(true)} aria-label="Close">✕</button>
            </div>
          </div>
        </div>
      )}

      <header className="topbar">
        <div className="container topbar-inner">
          <Link to="/" aria-label="home" onClick={close} className="topbar-brand">
            <Logo markSize={52} light={false} showText={false} />
          </Link>

          <nav className="topbar-nav">
            {navLinks.map((l) => (
              <Link key={l.to} onClick={close} to={l.to} className="topbar-link">{l.l}</Link>
            ))}
          </nav>

          <div className="topbar-actions">
            <Link to="/store" className="topbar-cart" aria-label="cart">
              <IconCreditCard />
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </Link>

            <button className="topbar-lang" onClick={() => setLang(l => (l === 'ar' ? 'en' : 'ar'))}>
              <IconGlobe /> {isAr ? 'EN' : 'ع'}
            </button>

            {user ? (
              <div className="user-menu-wrap" ref={userMenuRef}>
                <button className="topbar-avatar" onClick={() => setUserMenuOpen(!userMenuOpen)}>
                  <span className="topbar-avatar-circle">{initial}</span>
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
                        <IconShield /> {isAr ? 'لوحة الإدارة' : 'Admin'}
                      </Link>
                    )}
                    <Link to="/nfc/demo" className="ud-item" onClick={close}>
                      <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8C10 8 16 14 16 21"/><path d="M7 8C11.5 8 15 11.5 15 16"/></svg>
                      {isAr ? 'معاينة البطاقة' : 'Card Preview'}
                    </Link>
                    <div className="ud-divider" />
                    <button className="ud-item ud-logout" onClick={() => { logout(); close() }}>
                      {isAr ? 'تسجيل الخروج' : 'Log out'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/account?mode=login" className="btn btn-ghost btn-sm topbar-cta">
                <IconUser /> {isAr ? 'تسجيل الدخول' : 'Sign in'}
              </Link>
            )}

            <button className="topbar-hamburger" onClick={toggleMobile} aria-label="menu">
              {mobileOpen ? <IconClose /> : <IconMenu />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="mobile-menu">
            <div className="mobile-menu-links">
              {navLinks.map((l) => (
                <button key={l.to} className="mobile-menu-link" onClick={() => go(l.to)}>{l.l}</button>
              ))}
            </div>
            {!user ? (
              <div className="mobile-menu-cta">
                <button className="btn btn-primary btn-block" onClick={() => go('/account?mode=register')}>
                  {isAr ? 'إنشاء حساب جديد' : 'Sign up'}
                </button>
              </div>
            ) : (
              <div className="mobile-menu-cta">
                <button className="btn btn-ghost btn-block" onClick={() => { logout(); close() }}>
                  {isAr ? 'تسجيل الخروج' : 'Log out'}
                </button>
              </div>
            )}
          </div>
        )}
      </header>
    </>
  )
}
