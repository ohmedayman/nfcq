import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { IconHome, IconCreditCard, NfcIcon, IconUser, IconZap } from './icons'

function getCartCount() {
  try {
    const cart = JSON.parse(localStorage.getItem('lamsa_cart') || '{}')
    return Object.values(cart).reduce((s, v) => s + (v || 0), 0)
  } catch { return 0 }
}

export default function MobileBottomNav() {
  const { user } = useAuth()
  const { lang } = useLang()
  const isAr = lang === 'ar'
  const location = useLocation()
  const [cartCount, setCartCount] = useState(getCartCount)

  useEffect(() => {
    const interval = setInterval(() => setCartCount(getCartCount()), 500)
    return () => clearInterval(interval)
  }, [])

  // Do not show on public profiles (/u/:uid or /:uid)
  const firstSeg = location.pathname.split('/')[1] || ''
  const isProfile = location.pathname.startsWith('/u/') || (firstSeg && !['store', 'account', 'dashboard', 'settings', 'admin', 'blog', 'contact', 'onboarding'].includes(firstSeg))
  if (isProfile) return null

  const p = location.pathname

  return (
    <nav className="mobile-bottom-bar" aria-label="Mobile Navigation">
      <Link to="/" className={`mbb-item ${p === '/' ? 'active' : ''}`}>
        <div className="mbb-icon"><IconHome size={22} /></div>
        <span className="mbb-label">{isAr ? 'الرئيسية' : 'Home'}</span>
      </Link>

      <Link to="/store" className={`mbb-item ${p.startsWith('/store') ? 'active' : ''}`}>
        <div className="mbb-icon" style={{ position: 'relative' }}>
          <IconCreditCard size={22} />
          {cartCount > 0 && <span className="mbb-badge">{cartCount}</span>}
        </div>
        <span className="mbb-label">{isAr ? 'المتجر' : 'Store'}</span>
      </Link>

      <Link to={user ? '/dashboard' : '/account?mode=register'} className={`mbb-item mbb-action-center ${p.startsWith('/dashboard') ? 'active' : ''}`}>
        <div className="mbb-center-btn">
          <NfcIcon size={26} />
        </div>
        <span className="mbb-label" style={{ marginTop: 2 }}>{user ? (isAr ? 'لوحتي' : 'Panel') : (isAr ? 'اصنع بطاقتك' : 'Create')}</span>
      </Link>

      <Link to="/blog" className={`mbb-item ${p.startsWith('/blog') ? 'active' : ''}`}>
        <div className="mbb-icon"><IconZap size={22} /></div>
        <span className="mbb-label">{isAr ? 'المدونة' : 'Blog'}</span>
      </Link>

      <Link to={user ? '/dashboard' : '/account'} className={`mbb-item ${p.startsWith('/account') ? 'active' : ''}`}>
        <div className="mbb-icon"><IconUser size={22} /></div>
        <span className="mbb-label">{user ? (isAr ? 'حسابي' : 'Account') : (isAr ? 'دخول' : 'Sign In')}</span>
      </Link>
    </nav>
  )
}
