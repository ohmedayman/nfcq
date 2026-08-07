import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { NfcIcon, IconMail } from '../components/icons'

export default function Account() {
  const { text, lang } = useLang()
  const isAr = lang === 'ar'
  const { user, loading, error, register, login, loginWithGoogle, logout, ready } = useAuth()
  const [mode, setMode] = useState('register')
  const [form, setForm] = useState({ name: '', email: '', pass: '' })
  const [busy, setBusy] = useState(false)
  const [ok, setOk] = useState('')

  useEffect(() => {
    if (user) setForm((f) => ({ ...f, email: user.email || '' }))
  }, [user])

  useEffect(() => {
    if (user) nav('/dashboard', { replace: true })
  }, [user, nav])

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setOk('')
    let success = false
    if (user) {
      success = true
    } else if (mode === 'register') {
      success = await register(form.email, form.pass, form.name)
    } else {
      success = await login(form.email, form.pass)
    }
    setBusy(false)
    if (success) setOk(isAr ? 'تم التسجيل بنجاح' : 'Done')
  }

  if (loading) {
    return (
      <section className="section"><div className="container" style={{ textAlign: 'center', color: 'var(--muted)' }}>
        {isAr ? 'جاري التحميل…' : 'Loading…'}
      </div></section>
    )
  }

  return (
    <section className="section">
      <div className="container auth-wrap">
        <div className="auth-info">
          <span className="kicker">Lamsa</span>
          <h2>{user ? (isAr ? 'أهلاً بك مجددًا 👋' : 'Welcome back') : (isAr ? 'ابدأ رحلتك الرقمية' : 'Start your digital journey')}</h2>
          <p>
            <NfcIcon style={{ verticalAlign: '-0.2em' }} />{' '}
            {isAr
              ? 'سجّل دخولك، أدر بطاقتك، واحفظ ملفك في حسابك الآمن.'
              : 'Sign in, manage your card, and keep your profile in a secure account.'}
          </p>
        </div>

        <div className="auth-card">
          {!ready ? (
            <ConfigHint isAr={isAr} />
          ) : user ? (
            <ProfileView user={user} logout={logout} isAr={isAr} />
          ) : (
            <>
              <div className="auth-tabs">
                <button className={mode === 'register' ? 'on' : ''} onClick={() => setMode('register')}>{text.account_register}</button>
                <button className={mode === 'login' ? 'on' : ''} onClick={() => setMode('login')}>{text.account_login}</button>
              </div>

              <form onSubmit={submit}>
                {mode === 'register' && (
                  <div className="field">
                    <label>{isAr ? 'الاسم الكامل' : 'Full name'}</label>
                    <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={isAr ? 'مثال: سارة أحمد' : 'e.g. Sarah Ahmed'} />
                  </div>
                )}
                <div className="field">
                  <label>Email</label>
                  <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@email.com" />
                </div>
                <div className="field">
                  <label>{isAr ? 'كلمة المرور' : 'Password'}</label>
                  <input required type="password" minLength="6" value={form.pass} onChange={(e) => setForm({ ...form, pass: e.target.value })} placeholder="••••••••" />
                </div>

                {error && <p className="auth-ok" style={{ color: '#ff5a6e' }}>{error}</p>}
                {ok && <p className="auth-ok">{ok}</p>}

                <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
                  {busy ? (isAr ? '…' : '…') : (mode === 'register' ? text.account_go : text.account_login)}
                </button>

                <button type="button" className="btn btn-ghost btn-block" style={{ marginTop: 12 }} onClick={async () => { const s = await loginWithGoogle(); if (s) setOk(isAr ? 'تم بنجاح' : 'Done'); }}>
                  <IconMail /> Google
                </button>

                <p className="auth-switch">
                  {mode === 'register' ? text.have_account : text.no_account}{' '}
                  <button type="button" onClick={() => setMode(mode === 'register' ? 'login' : 'register')}>
                    {mode === 'register' ? text.account_login : text.account_register}
                  </button>
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  )
}

function ProfileView({ isAr }) {
  const { user, logout } = useAuth()
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <div style={{ width: 54, height: 54, borderRadius: '50%', background: 'var(--grad)', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: '1.3rem', color: '#fff' }}>
          {(user.displayName || user.email || 'L').charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>{user.displayName || (user.email || '').split('@')[0]}</div>
          <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{user.email}</div>
        </div>
      </div>
      <Link to="/nfc/demo" className="btn btn-primary btn-block">{isAr ? 'اعرض صفحة بطاقتك' : 'View your card page'}</Link>
      <button className="btn btn-ghost btn-block" style={{ marginTop: 10 }} onClick={logout}>{isAr ? 'تسجيل الخروج' : 'Logout'}</button>
    </div>
  )
}

function ConfigHint() {
  const { lang } = useLang()
  const isAr = lang === 'ar'
  return (
    <div style={{ padding: '10px 4px' }}>
      <div style={{ fontWeight: 800, marginBottom: 10, color: 'var(--ice)' }}>
        {isAr ? '⚙️ &nbsp;Firebase لسه غير مربوطة' : '⚙️ &nbsp;Firebase not connected yet'}
      </div>
      <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.8 }}>
        {isAr
          ? 'افتح الملف &lrm;src/firebase.config.js&lrm; وضع مفاتيح مشروعك، ثم أعد التشغيل.'
          : 'Open &lrm;src/firebase.config.js&rlm; add your project keys, then restart.'}
      </p>
    </div>
  )
}