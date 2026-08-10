import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLang } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { toast } from '../components/Toast'
import { IconShield, IconRefresh, IconUser } from '../components/icons'

export default function Settings() {
  const { user, logout } = useAuth()
  const { lang, setLang } = useLang()
  const isAr = lang === 'ar'
  const nav = useNavigate()

  const [name, setName] = useState(user?.displayName || '')
  const [email, setEmail] = useState(user?.email || '')
  const [phone, setPhone] = useState(localStorage.getItem('lamsa_phone') || '')
  const [notifications, setNotifications] = useState(localStorage.getItem('lamsa_notifications') !== 'false')
  const [darkMode, setDarkMode] = useState(localStorage.getItem('lamsa_theme') === 'dark')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!user) { nav('/account'); return }
  }, [user])

  function save() {
    localStorage.setItem('lamsa_phone', phone)
    localStorage.setItem('lamsa_notifications', notifications)
    localStorage.setItem('lamsa_theme', darkMode ? 'dark' : 'light')
    setSaved(true)
    toast(isAr ? 'تم حفظ الإعدادات ✓' : 'Settings saved ✓')
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleLogout() {
    await logout()
    nav('/')
  }

  if (!user) return null

  return (
    <section className="section dash-section">
      <div className="container" style={{ maxWidth: 700, margin: '0 auto' }}>
        <div className="dash-header">
          <div>
            <h2 className="dash-title"><IconShield /> {isAr ? 'الإعدادات' : 'Settings'}</h2>
            <p className="dash-sub">{isAr ? 'إدارة حسابك وتفضيلاتك' : 'Manage your account and preferences'}</p>
          </div>
        </div>

        {/* Profile */}
        <div className="dash-card" style={{ marginBottom: 20 }}>
          <div className="dash-card-header">
            <h3>{isAr ? 'الحساب' : 'Account'}</h3>
          </div>
          <div style={{ display: 'grid', gap: 16 }}>
            <div className="field">
              <label>{isAr ? 'الاسم' : 'Name'}</label>
              <input value={name} onChange={(e) => setName(e.target.value)} disabled />
            </div>
            <div className="field">
              <label>{isAr ? 'البريد الإلكتروني' : 'Email'}</label>
              <input value={email} disabled dir="ltr" style={{ textAlign: 'left' }} />
            </div>
            <div className="field">
              <label>{isAr ? 'الهاتف' : 'Phone'}</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={isAr ? '01000000000' : '01000000000'} dir="ltr" style={{ textAlign: 'left' }} />
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="dash-card" style={{ marginBottom: 20 }}>
          <div className="dash-card-header">
            <h3>{isAr ? 'التفضيلات' : 'Preferences'}</h3>
          </div>
          <div style={{ display: 'grid', gap: 16 }}>
            <div className="settings-row">
              <div>
                <b>{isAr ? 'اللغة' : 'Language'}</b>
                <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{isAr ? 'تغيير لغة الواجهة' : 'Change interface language'}</p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setLang(l => l === 'ar' ? 'en' : 'ar')}>
                {isAr ? 'English' : 'العربية'}
              </button>
            </div>
            <div className="settings-row">
              <div>
                <b>{isAr ? 'الإشعارات' : 'Notifications'}</b>
                <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{isAr ? 'استلام إشعارات بالبريد' : 'Receive email notifications'}</p>
              </div>
              <label className="toggle">
                <input type="checkbox" checked={notifications} onChange={(e) => setNotifications(e.target.checked)} />
                <span className="toggle-slider" />
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="dash-card">
          <div className="dash-card-header">
            <h3>{isAr ? 'إجراءات' : 'Actions'}</h3>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={save}>
              {saved ? '✓' : (isAr ? 'حفظ' : 'Save')}
            </button>
            <Link to="/dashboard" className="btn btn-ghost">
              {isAr ? 'لوحة التحكم' : 'Dashboard'}
            </Link>
            <button className="btn btn-ghost" style={{ color: '#ef4444' }} onClick={handleLogout}>
              {isAr ? 'تسجيل خروج' : 'Logout'}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
