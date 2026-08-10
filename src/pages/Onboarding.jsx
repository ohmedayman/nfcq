import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { toast } from '../components/Toast'
import { initProfileIfMissing, fetchProfile, saveProfile, uploadAvatar } from '../lib/firebase'
import {
  NfcIcon, IconCheck, IconRefresh,
  IconInstagram, IconLinkedin, IconTwitter, IconWhatsApp,
} from '../components/icons'

const STEPS = [
  { key: 'welcome', icon: '👋' },
  { key: 'profile', icon: '👤' },
  { key: 'social', icon: '📱' },
  { key: 'done', icon: '🚀' },
]

export default function Onboarding() {
  const { user } = useAuth()
  const { lang } = useLang()
  const isAr = lang === 'ar'
  const nav = useNavigate()

  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [form, setForm] = useState({ name: '', role: '', bio: '', avatar: '' })
  const [social, setSocial] = useState({ instagram: '', linkedin: '', twitter: '', whatsapp: '' })

  const setV = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const setS = (k) => (e) => setSocial((s) => ({ ...s, [k]: e.target.value }))

  useEffect(() => {
    if (!user) { setLoading(false); return }
    let alive = true
    ;(async () => {
      try {
        await initProfileIfMissing(user.uid, user.email, user.displayName || '')
        const d = await fetchProfile(user.uid)
        if (!alive) return
        if (d) {
          setForm({
            name: d.name || user.displayName || '',
            role: d.role || '',
            bio: d.bio || '',
            avatar: d.avatar || '',
          })
          setSocial({
            instagram: d.social?.instagram || '',
            linkedin: d.social?.linkedin || '',
            twitter: d.social?.twitter || '',
            whatsapp: d.social?.whatsapp || '',
          })
          if (d.name && d.role) setStep(2)
        }
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [user])

  async function onUpload(e) {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadAvatar(user.uid, file)
      setForm((f) => ({ ...f, avatar: url }))
      toast(isAr ? 'تم رفع الصورة ✓' : 'Photo uploaded ✓')
    } catch {
      toast(isAr ? 'تعذر رفع الصورة' : 'Upload failed', 'error')
    }
    setUploading(false)
    e.target.value = ''
  }

  async function saveProfileStep() {
    setSaving(true)
    try {
      await saveProfile(user.uid, { ...form, social })
      toast(isAr ? 'تم الحفظ ✓' : 'Saved ✓')
      setStep((s) => s + 1)
    } catch {
      toast(isAr ? 'تعذر الحفظ' : 'Save failed', 'error')
    }
    setSaving(false)
  }

  async function finishSetup() {
    setSaving(true)
    try {
      await saveProfile(user.uid, { ...form, social })
      toast(isAr ? 'تم الحفظ ✓' : 'Saved ✓')
      setStep(3)
    } catch {
      toast(isAr ? 'تعذر الحفظ' : 'Save failed', 'error')
    }
    setSaving(false)
  }

  const url = user ? `https://lamsa.ink/u/${user.uid}` : ''

  if (loading) {
    return (
      <div className="nfc-page">
        <div className="aurora" />
        <div className="container nfc-wrap" style={{ textAlign: 'center', paddingTop: 120 }}>
          <div className="nfc-loader" />
          <p style={{ color: 'var(--muted)', marginTop: 20 }}>{isAr ? 'جاري التحميل…' : 'Loading…'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="nfc-page">
      <div className="aurora" />
      <div className="container nfc-wrap">
        <div className="onboard-brand">
          <Link to="/"><NfcIcon size="1.8em" /> <b>Lamsa</b></Link>
        </div>

        {step < 3 && (
          <div className="onboard-progress">
            {STEPS.slice(0, 3).map((s, i) => (
              <div key={i} className={`op-step ${i <= step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
                <div className="op-dot">{i < step ? '✓' : s.icon}</div>
                {i < 2 && <div className={`op-line ${i < step ? 'done' : ''}`} />}
              </div>
            ))}
          </div>
        )}

        <div className={`onboard-card ${step === 3 ? 'final' : ''}`}>
          {/* Step 0: Welcome / Auth */}
          {step === 0 && (
            <div className="ob-content">
              <div className="ob-icon">🎉</div>
              <h2>{isAr ? 'أهلاً بك في Lamsa!' : 'Welcome to Lamsa!'}</h2>
              <p className="ob-sub">
                {isAr
                  ? 'بطاقتك الرقمية جاهزة! دلوقتي نحتاج نعرف عنك شوية عشان نعمل صفحتك.'
                  : 'Your digital card is ready! Now let\'s set up your page.'}
              </p>
              <div className="ob-features">
                <div className="ob-feature">
                  <span className="ob-feature-icon">✨</span>
                  <div>
                    <b>{isAr ? 'بطاقة احترافية' : 'Professional card'}</b>
                    <p>{isAr ? 'تصميم جذاب يعكس هويتك' : 'A design that reflects your identity'}</p>
                  </div>
                </div>
                <div className="ob-feature">
                  <span className="ob-feature-icon">🔗</span>
                  <div>
                    <b>{isAr ? 'رابط مخصص' : 'Custom link'}</b>
                    <p>{isAr ? 'رابط يبدأ بـ lamsa.ink/u/...' : 'A link starting with lamsa.ink/u/...'}</p>
                  </div>
                </div>
                <div className="ob-feature">
                  <span className="ob-feature-icon">📊</span>
                  <div>
                    <b>{isAr ? 'إحصائيات' : 'Analytics'}</b>
                    <p>{isAr ? 'تابع عدد الزيارات والتفاعل' : 'Track visits and engagement'}</p>
                  </div>
                </div>
              </div>
              {user ? (
                <button className="btn btn-primary btn-lg" onClick={() => setStep(1)}>
                  {isAr ? 'ابدأ الإعداد' : 'Start setup'} →
                </button>
              ) : (
                <div className="ob-auth">
                  <Link to="/account?redirect=/onboarding" className="btn btn-primary btn-lg btn-block">
                    {isAr ? 'سجّل دخولك' : 'Sign in'}
                  </Link>
                  <p className="auth-switch">
                    {isAr ? 'ما عندكش حساب؟' : "Don't have an account?"}{' '}
                    <Link to="/account?redirect=/onboarding">{isAr ? 'سجّل الآن' : 'Sign up'}</Link>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 1: Profile */}
          {step === 1 && (
            <div className="ob-content">
              <h2>{isAr ? 'بياناتك الأساسية' : 'Your basic info'}</h2>
              <p className="ob-sub">{isAr ? 'الاسم والمهنة اللي هتظهر في بطاقتك.' : 'Name and role shown on your card.'}</p>

              <div className="avatar-upload">
                <div className="avatar-preview">
                  {form.avatar ? <img src={form.avatar} alt="" /> : <span>{(form.name || 'U').charAt(0).toUpperCase()}</span>}
                </div>
                <div className="avatar-info">
                  <b>{isAr ? 'صورة البروفايل' : 'Profile photo'}</b>
                  <p>{isAr ? 'اختياري — صورة شخصية' : 'Optional — personal photo'}</p>
                  <label className="btn btn-ghost btn-sm">
                    {uploading ? '…' : (isAr ? 'رفع صورة' : 'Upload')}
                    <input type="file" accept="image/*" onChange={onUpload} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>

              <div className="field">
                <label>{isAr ? 'الاسم الكامل' : 'Full name'} *</label>
                <input value={form.name} onChange={setV('name')} placeholder={isAr ? 'محمد أحمد' : 'John Doe'} />
              </div>
              <div className="field">
                <label>{isAr ? 'المهنة / الدور' : 'Role / Title'} *</label>
                <input value={form.role} onChange={setV('role')} placeholder={isAr ? 'مصمم UX · القاهرة' : 'UX Designer · Cairo'} />
              </div>
              <div className="field">
                <label>{isAr ? 'نبذة عنك' : 'Bio'} <small>({isAr ? 'اختياري' : 'optional'})</small></label>
                <textarea value={form.bio} onChange={setV('bio')} rows={2} maxLength={160} placeholder={isAr ? '几句 عن نفسك…' : 'A short bio about you…'} />
                <span className="field-hint">{form.bio.length}/160</span>
              </div>

              {/* Live preview */}
              {(form.name || form.role) && (
                <div className="ob-mini-preview">
                  <div className="ob-mp-cover" />
                  <div className="ob-mp-avatar">
                    {form.avatar ? <img src={form.avatar} alt="" /> : (form.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="ob-mp-name">{form.name || (isAr ? 'اسمك' : 'Your name')}</div>
                  {form.role && <div className="ob-mp-role">{form.role}</div>}
                </div>
              )}

              <div className="ob-actions">
                <button className="btn btn-ghost" onClick={() => setStep(0)}>← {isAr ? 'رجوع' : 'Back'}</button>
                <button className="btn btn-primary btn-lg" onClick={() => {
                  if (!form.name || !form.role) return toast(isAr ? 'أكمل الاسم والمهنة' : 'Name and role required', 'error')
                  saveProfileStep()
                }} disabled={saving}>
                  {saving ? '…' : (isAr ? 'التالي' : 'Continue')} →
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Social */}
          {step === 2 && (
            <div className="ob-content">
              <h2>{isAr ? 'سوشيال ميديا' : 'Social media'}</h2>
              <p className="ob-sub">{isAr ? 'أضف روابط منصاتك — اختياري بس بيحسن شكل البطاقة.' : 'Add your social links — optional but makes your card look better.'}</p>

              <div className="social-field">
                <div className="sf-icon" style={{ background: '#E4405F', color: '#fff' }}><IconInstagram /></div>
                <div className="sf-input">
                  <label>Instagram</label>
                  <input value={social.instagram} onChange={setS('instagram')} placeholder="https://instagram.com/you" dir="ltr" style={{ textAlign: 'left' }} />
                </div>
              </div>
              <div className="social-field">
                <div className="sf-icon" style={{ background: '#0A66C2', color: '#fff' }}><IconLinkedin /></div>
                <div className="sf-input">
                  <label>LinkedIn</label>
                  <input value={social.linkedin} onChange={setS('linkedin')} placeholder="https://linkedin.com/in/you" dir="ltr" style={{ textAlign: 'left' }} />
                </div>
              </div>
              <div className="social-field">
                <div className="sf-icon" style={{ background: '#000', color: '#fff' }}><IconTwitter /></div>
                <div className="sf-input">
                  <label>X / Twitter</label>
                  <input value={social.twitter} onChange={setS('twitter')} placeholder="https://x.com/you" dir="ltr" style={{ textAlign: 'left' }} />
                </div>
              </div>
              <div className="social-field">
                <div className="sf-icon" style={{ background: '#25D366', color: '#fff' }}><IconWhatsApp /></div>
                <div className="sf-input">
                  <label>WhatsApp</label>
                  <input value={social.whatsapp} onChange={setS('whatsapp')} placeholder="https://wa.me/201000000000" dir="ltr" style={{ textAlign: 'left' }} />
                </div>
              </div>

              <button className="btn btn-ghost" style={{ fontSize: '0.88rem', marginTop: 4 }} onClick={finishSetup}>
                {isAr ? 'تخطي — أكمل لاحقاً' : 'Skip — add later'}
              </button>

              <div className="ob-actions">
                <button className="btn btn-ghost" onClick={() => setStep(1)}>← {isAr ? 'رجوع' : 'Back'}</button>
                <button className="btn btn-primary btn-lg" onClick={finishSetup} disabled={saving}>
                  {saving ? '…' : (isAr ? 'إنهاء' : 'Finish')} ✓
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Done */}
          {step === 3 && (
            <div className="ob-content ob-done">
              <div className="ob-success-icon">🚀</div>
              <h2>{isAr ? 'بطاقتك جاهزة!' : 'Your card is ready!'}</h2>
              <p className="ob-sub">{isAr ? 'ده رابط بطاقتك — امسحه أو شاركه مع أي حد.' : 'This is your card link — share it with anyone.'}</p>

              <div className="ob-link-box">
                <div className="ob-link-url">{url}</div>
                <button className="btn btn-primary" onClick={() => {
                  navigator.clipboard.writeText(url)
                  toast(isAr ? 'تم النسخ ✓' : 'Copied ✓')
                }}>
                  <IconCheck /> {isAr ? 'نسخ' : 'Copy'}
                </button>
              </div>

              {/* Share buttons */}
              <div className="ob-share-row">
                <a href={`https://wa.me/?text=${encodeURIComponent(url)}`} target="_blank" rel="noreferrer" className="ob-share-link" style={{ background: '#25D366' }}>WhatsApp</a>
                <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent('Check my digital card')}&url=${encodeURIComponent(url)}`} target="_blank" rel="noreferrer" className="ob-share-link" style={{ background: '#000' }}>X</a>
                <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noreferrer" className="ob-share-link" style={{ background: '#1877F2' }}>Facebook</a>
              </div>

              <div className="ob-preview">
                <div className="preview-phone">
                  <div className="preview-notch" />
                  <div className="preview-screen">
                    <div className="preview-cover" />
                    <div className="preview-avatar">
                      {form.avatar ? <img src={form.avatar} alt="" /> : (form.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="preview-name">{form.name}</div>
                    {form.role && <div className="preview-role">{form.role}</div>}
                    {form.bio && <div className="preview-bio">{form.bio}</div>}
                    <div className="preview-socials">
                      {social.instagram && <span className="ps-icon" style={{ background: '#E4405F' }}><IconInstagram /></span>}
                      {social.linkedin && <span className="ps-icon" style={{ background: '#0A66C2' }}><IconLinkedin /></span>}
                      {social.twitter && <span className="ps-icon" style={{ background: '#000' }}><IconTwitter /></span>}
                      {social.whatsapp && <span className="ps-icon" style={{ background: '#25D366' }}><IconWhatsApp /></span>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="ob-actions ob-actions-col">
                <a href={url} target="_blank" rel="noreferrer" className="btn btn-primary btn-lg btn-block">
                  <IconRefresh /> {isAr ? 'فتح بطاقتي' : 'Open my card'}
                </a>
                <Link to="/dashboard" className="btn btn-ghost btn-block">
                  {isAr ? 'لوحة التحكم' : 'Dashboard'}
                </Link>
                <Link to="/" className="btn btn-ghost btn-block">
                  {isAr ? 'العودة للرئيسية' : 'Go home'}
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
