import { useState, useEffect, useRef, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { toast } from '../components/Toast'
import { FIREBASE_READY } from '../firebase.config'
import { initProfileIfMissing, fetchProfile, saveProfile, uploadAvatar, listUserOrders } from '../lib/firebase'
import { normalizeUrl, normalizeSocialUrl, CARD_THEMES } from '../lib/utils'
import {
  IconUser, IconLink, IconCreditCard, IconCheck, IconPlus, IconRefresh, IconHome,
  IconInstagram, IconLinkedin, IconTwitter, IconWhatsApp, IconShield, IconZap, NfcIcon,
} from '../components/icons'

export default function Dashboard() {
  const { user } = useAuth()
  const { lang } = useLang()
  const isAr = lang === 'ar'
  const nav = useNavigate()

  const [tab, setTab] = useState('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [orders, setOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(false)

  const fallbackName = user?.displayName || (user?.email || '').split('@')[0]
  const [form, setForm] = useState({ name: fallbackName, role: '', email: user?.email || '', bio: '', phone: '', avatar: '', theme: 'default' })
  const [links, setLinks] = useState([])
  const [social, setSocial] = useState({ instagram: '', linkedin: '', twitter: '', whatsapp: '' })
  const [activated, setActivated] = useState(true)

  const setV = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const setS = (k) => (e) => setSocial((s) => ({ ...s, [k]: e.target.value }))

  useEffect(() => {
    if (!user) { nav('/account'); return }
    let alive = true
    setLoading(true)
    ;(async () => {
      try {
        await initProfileIfMissing(user.uid, user.email, user.displayName || '')
        const d = await fetchProfile(user.uid)
        if (!alive) return
        if (d) {
          setForm({
            name: d.name || fallbackName,
            role: d.role || '',
            email: d.email || user.email || '',
            bio: d.bio || '',
            phone: d.phone || '',
            avatar: d.avatar || '',
            theme: d.theme || 'default',
          })
          setLinks(Array.isArray(d.links) ? d.links : [])
          setSocial({ instagram: d.social?.instagram || '', linkedin: d.social?.linkedin || '', twitter: d.social?.twitter || '', whatsapp: d.social?.whatsapp || '' })
          setActivated(d.activated !== false)
        }
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [user])

  async function save() {
    setSaving(true)
    try {
      // Normalize social URLs before saving
      const normalizedSocial = {
        instagram: normalizeSocialUrl('instagram', social.instagram),
        linkedin: normalizeSocialUrl('linkedin', social.linkedin),
        twitter: normalizeSocialUrl('twitter', social.twitter),
        whatsapp: normalizeSocialUrl('whatsapp', social.whatsapp),
      }
      // Normalize custom link URLs
      const normalizedLinks = links.map((l) => ({
        ...l,
        url: normalizeUrl(l.url),
      }))
      await saveProfile(user.uid, { ...form, links: normalizedLinks, social: normalizedSocial })
      // Update local state with normalized values
      setSocial(normalizedSocial)
      setLinks(normalizedLinks)
      toast(isAr ? 'تم حفظ التغييرات ✓' : 'Changes saved ✓')
    } catch (err) {
      console.error('Save error:', err)
      toast(isAr ? 'لم يتم الحفظ — حاول مجددًا' : 'Save failed — try again', 'error')
    }
    setSaving(false)
  }

  async function onUpload(e) {
    const file = e.target.files && e.target.files[0]
    if (!file) return

    // Validate file before attempting upload
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      toast(isAr ? 'نوع الملف غير مدعوم — استخدم JPG أو PNG أو WebP' : 'Unsupported file type — use JPG, PNG, or WebP', 'error')
      e.target.value = ''
      return
    }
    const sizeMB = file.size / (1024 * 1024)
    if (sizeMB > 5) {
      toast(isAr ? `الملف كبير جداً (${sizeMB.toFixed(1)}MB) — الحد الأقصى 5MB` : `File too large (${sizeMB.toFixed(1)}MB) — max 5MB`, 'error')
      e.target.value = ''
      return
    }

    setUploading(true)
    try {
      const url = await uploadAvatar(user.uid, file)
      setForm((f) => ({ ...f, avatar: url }))
      toast(isAr ? 'تم رفع الصورة بنجاح ✓' : 'Photo uploaded successfully ✓')
    } catch (err) {
      console.warn('Upload fallback triggered:', err)
      try {
        const { compressImage } = await import('../lib/utils')
        const fallbackUrl = await compressImage(file, 350, 350, 0.85)
        setForm((f) => ({ ...f, avatar: fallbackUrl }))
        toast(isAr ? 'تم تحديث الصورة بنجاح ✓' : 'Photo updated successfully ✓')
      } catch {
        toast(isAr ? 'حدث خطأ في معالجة الصورة' : 'Failed to process image', 'error')
      }
    } finally {
      setUploading(false)
      if (e.target) e.target.value = ''
    }
  }

  async function loadOrders() {
    setLoadingOrders(true)
    try { setOrders(await listUserOrders(user.uid)) } finally { setLoadingOrders(false) }
  }

  const setLink = (i, k, v) => setLinks((L) => L.map((it, idx) => (idx === i ? { ...it, [k]: v } : it)))
  const addLink = () => setLinks((L) => [...L, { label: '', url: '', icon: '' }])
  const delLink = (i) => setLinks((L) => L.filter((_, idx) => idx !== i))
  const moveLink = (i, dir) => setLinks((L) => {
    const n = [...L]
    const j = i + dir
    if (j < 0 || j >= n.length) return n
    ;[n[i], n[j]] = [n[j], n[i]]
    return n
  })

  if (loading) {
    return (
      <section className="section">
        <div className="container dash-loading">
          <div className="nfc-loader" />
          <p style={{ color: 'var(--muted)', marginTop: 16 }}>{isAr ? 'بيتحمّل يا معلم...' : 'Loading your profile…'}</p>
        </div>
      </section>
    )
  }

  if (!FIREBASE_READY) {
    return (
      <section className="section">
        <div className="container dash-loading">
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚙️</div>
          <h2>{isAr ? 'Firebase لسه مش مربوطة' : 'Firebase not connected'}</h2>
          <p style={{ color: 'var(--muted)', margin: '12px 0 28px' }}>
            {isAr ? 'حط المفاتيح في firebase.config.js عشان تفتح لوحة التحكم.' : 'Add your keys in firebase.config.js to unlock the dashboard.'}
          </p>
        </div>
      </section>
    )
  }

  const url = `https://lamsa.ink/u/${user.uid}`
  const linkCount = links.length
  const socialCount = Object.values(social).filter(Boolean).length
  const hasProfile = !!(form.name && form.role)

  const tabs = [
    { id: 'profile', icon: <IconUser />, label: isAr ? 'البروفايل' : 'Profile' },
    { id: 'themes', icon: <span style={{ fontSize: '1.1rem' }}>🎨</span>, label: isAr ? 'الثيمات' : 'Themes' },
    { id: 'social', icon: <IconLink />, label: isAr ? 'سوشيال' : 'Social', badge: socialCount || null },
    { id: 'links', icon: <IconZap />, label: isAr ? 'الروابط' : 'Links', badge: linkCount || null },
    { id: 'orders', icon: <IconCreditCard />, label: isAr ? 'طلباتي' : 'Orders' },
    { id: 'nfc', icon: <NfcIcon />, label: isAr ? 'بطاقة NFC' : 'NFC Card' },
  ]

  return (
    <section className="section dash-section">
      <div className="container">
        <div className="dash-header">
          <div className="dash-header-left">
            <div className="dash-avatar-lg">
              {form.avatar
                ? <img src={form.avatar} alt="" />
                : <span>{(form.name || 'U').charAt(0).toUpperCase()}</span>}
            </div>
            <div>
              <h2 className="dash-title">{form.name || user?.email}</h2>
              <p className="dash-sub">{form.role || (isAr ? 'لسه مضافتش مهنة' : 'No role added yet')}</p>
            </div>
          </div>
          <div className="dash-header-actions">
            <button className="btn btn-ghost" onClick={() => {
              navigator.clipboard.writeText(url)
              toast(isAr ? 'اتنسخ الرابط ✓' : 'Link copied ✓')
            }}>
              <IconCheck /> {isAr ? 'نسخ الرابط' : 'Copy link'}
            </button>
            <a href={url} target="_blank" rel="noreferrer" className="btn btn-ghost">
              <IconRefresh /> {isAr ? ' شوف' : 'Preview'}
            </a>
          </div>
        </div>

        {/* Stats row */}
        <div className="dash-stats">
          <div className={`dash-stat ${hasProfile ? 'active' : ''}`}>
            <div className="ds-icon"><IconUser /></div>
            <div><b>{hasProfile ? '✓' : '—'}</b><span>{isAr ? 'البروفايل' : 'Profile'}</span></div>
          </div>
          <div className={`dash-stat ${socialCount > 0 ? 'active' : ''}`}>
            <div className="ds-icon"><IconLink /></div>
            <div><b>{socialCount}</b><span>{isAr ? 'سوشيال ميديا' : 'Social links'}</span></div>
          </div>
          <div className={`dash-stat ${linkCount > 0 ? 'active' : ''}`}>
            <div className="ds-icon"><IconZap /></div>
            <div><b>{linkCount}</b><span>{isAr ? 'رابط خاص' : 'Custom links'}</span></div>
          </div>
          <div className="dash-stat active">
            <div className="ds-icon"><NfcIcon /></div>
            <div><b>{isAr ? 'نشط ✓' : 'Active ✓'}</b><span>{isAr ? 'بطاقة NFC' : 'NFC Card'}</span></div>
          </div>
        </div>

        {/* Tabs */}
        <div className="dash-tabs">
          {tabs.map((t) => (
            <button key={t.id} className={`dash-tab ${tab === t.id ? 'on' : ''}`} onClick={() => setTab(t.id)}>
              {t.icon} <span>{t.label}</span>
              {t.badge && <span className="tab-badge">{t.badge}</span>}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="dash-content">
          <div className="dash-main">
            {tab === 'profile' && (
              <div className="dash-card">
                <div className="dash-card-header">
                  <h3>{isAr ? 'البروفايل بتاعك' : 'Profile'}</h3>
                  <p>{isAr ? 'البيانات بتاعتك اللي بتظهر لما حد يلمس البطاقة.' : 'Details shown when your card is tapped.'}</p>
                </div>
                <AvatarUpload avatar={form.avatar} name={form.name || 'L'} uploading={uploading} onUpload={onUpload} isAr={isAr} />
                <div className="form-row">
                  <div className="field"><label>{isAr ? 'الاسم الكامل' : 'Full name'}</label><input value={form.name} onChange={setV('name')} placeholder={isAr ? 'محمد أحمد' : 'John Doe'} /></div>
                  <div className="field"><label>{isAr ? 'المهنة / الدور' : 'Role / Title'}</label><input value={form.role} onChange={setV('role')} placeholder={isAr ? 'مصمم UX · القاهرة' : 'UX Designer · Cairo'} /></div>
                </div>
                <div className="form-row">
                  <div className="field"><label>Email</label><input value={form.email} disabled /></div>
                  <div className="field"><label>{isAr ? 'التليفون' : 'Phone'}</label><input value={form.phone} onChange={setV('phone')} placeholder="+20 100 000 0000" /></div>
                </div>
                <div className="field">
                  <label>{isAr ? 'عن نفسك' : 'Bio'}</label>
                  <textarea value={form.bio} onChange={setV('bio')} rows={3} placeholder={isAr ? '几句 عن نفسك…' : 'A short bio about you…'} />
                  <span className="field-hint">{form.bio.length}/160</span>
                </div>
                <button className="btn btn-primary" onClick={save} disabled={saving}>
                  <IconCheck /> {saving ? '…' : (isAr ? 'سيڤ التغييرات' : 'Save changes')}
                </button>
              </div>
            )}

            {tab === 'social' && (
              <div className="dash-card">
                <div className="dash-card-header">
                  <h3>{isAr ? 'السوشيال ميديا' : 'Social media'}</h3>
                  <p>{isAr ? 'روابط السوشيال بتاعتك بتظهر كأيقونات في صفحة البطاقة.' : 'Your links appear as icons on your card page.'}</p>
                </div>
                <SocialField icon={<IconInstagram />} lbl="Instagram" ph="https://instagram.com/you" v={social.instagram} onChange={setS('instagram')} color="#E4405F" />
                <SocialField icon={<IconLinkedin />} lbl="LinkedIn" ph="https://linkedin.com/in/you" v={social.linkedin} onChange={setS('linkedin')} color="#0A66C2" />
                <SocialField icon={<IconTwitter />} lbl="X / Twitter" ph="https://x.com/you" v={social.twitter} onChange={setS('twitter')} color="#000" />
                <SocialField icon={<IconWhatsApp />} lbl="WhatsApp" ph="https://wa.me/201000000000" v={social.whatsapp} onChange={setS('whatsapp')} color="#25D366" />
                <div style={{ height: 14 }} />
                <button className="btn btn-primary" onClick={save} disabled={saving}>
                  <IconCheck /> {saving ? '…' : (isAr ? 'سيڤ' : 'Save')}
                </button>
              </div>
            )}

            {tab === 'links' && (
              <div className="dash-card">
                <div className="dash-card-header">
                  <h3>{isAr ? 'الروابط بتاعتك' : 'Custom links'}</h3>
                  <p>{isAr ? 'الروابط بتاعتك بتظهر كأزرار في صفحة البطاقة. رتّبها زي ما تحب.' : 'Links appear as buttons on your card page. Arrange them in order.'}</p>
                </div>
                {links.length === 0 && (
                  <div className="empty-state">
                    <div className="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></div>
                    <h4>{isAr ? 'لسه مفيش روابط' : 'No links yet'}</h4>
                    <p>{isAr ? 'أضف أول رابط يظهر في صفحة البطاقة بتاعتك.' : 'Add your first link to show on your card page.'}</p>
                    <button className="btn btn-primary" onClick={addLink}><IconPlus /> {isAr ? 'أضف رابط' : 'Add link'}</button>
                  </div>
                )}
                {links.length > 0 && (
                  <>
                    {links.map((l, i) => (
                      <div className="link-card-editor" key={i}>
                        <div className="link-card-num">{String(i + 1).padStart(2, '0')}</div>
                        <div className="link-card-fields">
                          <div className="field"><label>{isAr ? 'العنوان' : 'Label'}</label><input value={l.label} onChange={(e) => setLink(i, 'label', e.target.value)} placeholder={isAr ? 'أعمالي' : 'Portfolio'} /></div>
                          <div className="field"><label>URL</label><input value={l.url} onChange={(e) => setLink(i, 'url', e.target.value)} placeholder="https://" dir="ltr" style={{ textAlign: 'left' }} /></div>
                        </div>
                        <div className="link-card-actions">
                          <button className="link-move-btn" onClick={() => moveLink(i, -1)} disabled={i === 0} title={isAr ? 'تحريك لأعلى' : 'Move up'}>↑</button>
                          <button className="link-move-btn" onClick={() => moveLink(i, 1)} disabled={i === links.length - 1} title={isAr ? 'تحريك لأسفل' : 'Move down'}>↓</button>
                          <button className="link-del-btn" onClick={() => delLink(i)} title={isAr ? 'حذف' : 'Delete'}>✕</button>
                        </div>
                      </div>
                    ))}
                    <button className="add-link" onClick={addLink}><IconPlus /> {isAr ? 'أضف رابط' : 'Add link'}</button>
                    <div style={{ height: 14 }} />
                    <button className="btn btn-primary" onClick={save} disabled={saving}>
                      <IconCheck /> {saving ? '…' : (isAr ? 'سيڤ' : 'Save')}
                    </button>
                  </>
                )}
              </div>
            )}

            {tab === 'orders' && (
              <div className="dash-card">
                <div className="dash-card-header">
                  <h3>{isAr ? 'الطلبات بتاعتي' : 'My orders'}</h3>
                  <p>{isAr ? 'سجل مشترياتك من المتجر.' : 'Your purchase history.'}</p>
                </div>
                <Orders orders={orders} loadingOrders={loadingOrders} loadOrders={loadOrders} isAr={isAr} />
              </div>
            )}

            {tab === 'nfc' && (
              <div className="dash-card">
                <div className="dash-card-header">
                  <h3>{isAr ? 'صفحة البطاقة بتاعتك' : 'NFC Card page'}</h3>
                  <p>{isAr ? 'الرابط اللي البطاقة بتوجّه إليه لما حد يلمسها.' : 'The link your card points to when tapped.'}</p>
                </div>
                <div className="nfc-link-box">
                  <div className="nfc-link-icon"><IconRefresh /></div>
                  <div className="nfc-link-info">
                    <b>{isAr ? 'رابط البطاقة بتاعتك' : 'Your card link'}</b>
                    <span className="nfc-link-url">{url}</span>
                  </div>
                  <button className="btn btn-primary" onClick={() => { navigator.clipboard.writeText(url); toast(isAr ? 'تم النسخ ✓' : 'Copied ✓') }}>
                    <IconCheck /> {isAr ? 'نسخ' : 'Copy'}
                  </button>
                </div>
                <div style={{ height: 18 }} />
                <div className="nfc-qr-section">
                  <div className="nfc-qr">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(url)}&format=svg&color=0c1830`}
                      alt="QR Code"
                      style={{ borderRadius: 12, width: '100%', height: 'auto' }}
                    />
                  </div>
                  <div className="nfc-qr-info">
                    <h4>{isAr ? 'كود الـ QR' : 'QR Code'}</h4>
                    <p>{isAr ? 'امسح الكود بكاميرا الموبايل بتاعك عشان تفتح صفحتك.' : 'Scan with your phone camera to open your page.'}</p>
                    <a className="btn btn-ghost btn-sm" href={url} target="_blank" rel="noreferrer"><IconRefresh /> {isAr ? 'افتح الصفحة' : 'Open page'}</a>
                  </div>
                </div>
              </div>
            )}

            {tab === 'themes' && (
              <div className="dash-card">
                <div className="dash-card-header">
                  <h3>{isAr ? 'اختر ثيم بطاقتك 🎨' : 'Choose Card Theme 🎨'}</h3>
                  <p>{isAr ? 'اختر النمط اللوني والتصميم الذي يناسب شخصيتك وعلامتك التجارية.' : 'Select the color palette and visual design for your card.'}</p>
                </div>
                <div className="theme-grid">
                  {CARD_THEMES.map((t) => {
                    const isSelected = (form.theme || 'default') === t.id
                    return (
                      <div
                        key={t.id}
                        className={`theme-card ${isSelected ? 'active' : ''}`}
                        onClick={async () => {
                          setForm((f) => ({ ...f, theme: t.id }))
                          try {
                            await saveProfile(user.uid, { theme: t.id })
                            toast(isAr ? `تم تفعيل ثيم: ${t.nameAr} ✓` : `${t.nameEn} theme active ✓`)
                          } catch (err) {
                            console.error(err)
                          }
                        }}
                      >
                        <div className="theme-preview" style={{ background: t.previewGrad }}>
                          <span className="theme-preview-badge">{isAr ? t.nameAr : t.nameEn}</span>
                        </div>
                        <div className="theme-card-info">
                          <span className="theme-card-title">{isAr ? t.nameAr : t.nameEn}</span>
                          <div className="theme-card-radio" />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Live Preview */}
          <div className="dash-preview">
            <div className="preview-label"><NfcIcon /> {isAr ? 'شكل مباشر' : 'Live preview'}</div>
            <div className={`preview-phone theme-${form.theme || 'default'}`}>
              <div className="preview-notch" />
              <div className="preview-screen">
                <div className="preview-cover" />
                <div className="preview-avatar">
                  {form.avatar ? <img src={form.avatar} alt="" /> : (form.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="preview-name">{form.name || (isAr ? 'اسمك' : 'Your Name')}</div>
                {form.role && <div className="preview-role">{form.role}</div>}
                {form.bio && <div className="preview-bio">{form.bio}</div>}

                <div className="preview-socials">
                  {social.instagram && <span className="ps-icon" style={{ background: '#E4405F' }}><IconInstagram /></span>}
                  {social.linkedin && <span className="ps-icon" style={{ background: '#0A66C2' }}><IconLinkedin /></span>}
                  {social.twitter && <span className="ps-icon" style={{ background: '#000' }}><IconTwitter /></span>}
                  {social.whatsapp && <span className="ps-icon" style={{ background: '#25D366' }}><IconWhatsApp /></span>}
                </div>

                {links.filter(l => l.label || l.url).length > 0 && (
                  <div className="preview-links">
                    {links.filter(l => l.label || l.url).slice(0, 5).map((l, i) => {
                      const colors = ['#667eea','#f5576c','#4facfe','#43e97b','#fa709a','#a18cd1']
                      return (
                        <div key={i} className="preview-link" style={{ '--plc': colors[i % colors.length] }}>
                          <span className="pl-dot" style={{ background: colors[i % colors.length] }} />
                          {l.label || l.url}
                        </div>
                      )
                    })}
                  </div>
                )}

                {(form.phone || form.email) && (
                  <div className="preview-contact">
                    {form.phone && <span>📱 {form.phone}</span>}
                    {form.email && <span>✉️ {form.email}</span>}
                  </div>
                )}
              </div>
            </div>
            <a href={url} target="_blank" rel="noreferrer" className="preview-open">{isAr ? 'افتح الصفحة كلها' : 'Open full page'}</a>
          </div>
        </div>
      </div>
    </section>
  )
}

function AvatarUpload({ avatar, name, uploading, onUpload, isAr }) {
  return (
    <div className="avatar-upload">
      <div className="avatar-preview">
        {avatar ? <img src={avatar} alt="avatar" /> : <span>{name.charAt(0).toUpperCase()}</span>}
      </div>
      <div className="avatar-info">
        <b>{isAr ? 'صورة البروفايل' : 'Profile photo'}</b>
        <p>{isAr ? 'صورة مربعة 400×400 على الأقل.' : 'Square image, 400×400px minimum.'}</p>
        <label className="btn btn-ghost btn-sm" style={{ pointerEvents: uploading ? 'none' : 'auto' }}>
          {uploading ? (isAr ? 'جاري الرفع…' : 'Uploading…') : (isAr ? 'ارفع صورة' : 'Upload photo')}
          <input type="file" accept="image/*" onChange={onUpload} style={{ display: 'none' }} disabled={uploading} />
        </label>
      </div>
    </div>
  )
}

function SocialField({ icon, lbl, ph, v, onChange, color }) {
  return (
    <div className="social-field">
      <div className="sf-icon" style={{ background: color || 'var(--cobalt-soft)', color: '#fff' }}>{icon}</div>
      <div className="sf-input">
        <label>{lbl}</label>
        <input value={v} onChange={onChange} placeholder={ph} dir="ltr" style={{ textAlign: 'left' }} />
      </div>
      {v && <span className="sf-check">✓</span>}
    </div>
  )
}

function Orders({ orders, loadingOrders, loadOrders, isAr }) {
  const [touched, setTouched] = useState(false)
  const [expandedOrder, setExpandedOrder] = useState(null)
  const loadT = async () => { await loadOrders(); setTouched(true) }

  const statusMap = {
    pending: { label: isAr ? 'قيد الانتظار' : 'Pending', color: '#f59e0b', icon: '⏳' },
    processing: { label: isAr ? 'جاري التجهيز' : 'Processing', color: '#3b82f6', icon: '📦' },
    shipped: { label: isAr ? 'تم الشحن' : 'Shipped', color: '#8b5cf6', icon: '🚚' },
    delivered: { label: isAr ? 'تم التوصيل' : 'Delivered', color: '#22c55e', icon: '✓' },
    done: { label: isAr ? 'مكتمل' : 'Completed', color: '#22c55e', icon: '✓' },
    cancelled: { label: isAr ? 'ملغي' : 'Cancelled', color: '#ef4444', icon: '✕' },
  }

  const getSteps = (status) => {
    const allSteps = ['pending', 'processing', 'shipped', 'done']
    let currentIdx = allSteps.indexOf(status || 'pending')
    if (currentIdx === -1 && (status === 'delivered' || status === 'completed')) currentIdx = 3
    if (currentIdx === -1 && status === 'cancelled') currentIdx = -1
    return allSteps.map((s, i) => ({
      ...statusMap[s],
      key: s,
      done: currentIdx >= 0 && i <= currentIdx,
      current: i === currentIdx,
    }))
  }

  return (
    <>
      {!touched && !loadingOrders && (
        <div className="empty-state">
          <div className="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg></div>
          <h4>{isAr ? 'طلباتي' : 'My orders'}</h4>
          <p>{isAr ? 'اعرض طلباتك السابقة وتتبع شحنها.' : 'View your past purchases and track shipping.'}</p>
          <button className="btn btn-primary" onClick={loadT}>{isAr ? 'شوف الطلبات' : 'Load orders'}</button>
        </div>
      )}
      {loadingOrders && <div style={{ textAlign: 'center', padding: 30 }}><div className="nfc-loader" /></div>}
      {touched && !loadingOrders && orders.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg></div>
          <h4>{isAr ? 'لسه مفيش طلبات' : 'No orders yet'}</h4>
          <p>{isAr ? 'ابدأ تتسوق من المتجر.' : 'Start shopping from the store.'}</p>
          <Link to="/store" className="btn btn-primary">{isAr ? 'روح المتجر' : 'Go to store'}</Link>
        </div>
      )}
      {touched && !loadingOrders && orders.length > 0 && (
        <div className="orders-list">
          {orders.map((o) => {
            const st = statusMap[o.status] || statusMap.pending
            const steps = getSteps(o.status)
            const isExpanded = expandedOrder === o.id
            const hasPhysical = (o.items || []).some((i) => !i.digital)

            return (
              <div key={o.id} className={`order-item ${isExpanded ? 'expanded' : ''}`}>
                <div className="order-top" onClick={() => setExpandedOrder(isExpanded ? null : o.id)}>
                  <div className="order-left">
                    <span className="order-id">#{o.id.slice(0, 8)}</span>
                    <span className="order-date">{o.createdAt ? new Date(o.createdAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US') : ''}</span>
                  </div>
                  <div className="order-right">
                    <span className="order-total">{o.total} {isAr ? 'ج.م' : 'EGP'}</span>
                    <span className={`status ${o.status || 'pending'}`}>{st.icon} {st.label}</span>
                    <span className="order-expand">{isExpanded ? '▾' : '▸'}</span>
                  </div>
                </div>

                <div className="order-items">{(o.items || []).map((i) => `${i.name} ×${i.qty}`).join(', ')}</div>

                {isExpanded && (
                  <div className="order-details">
                    {/* Tracking Steps */}
                    {hasPhysical && (
                      <div className="order-tracking">
                        <h4>{isAr ? 'متابعة الشحن' : 'Shipping tracking'}</h4>
                        <div className="tracking-steps">
                          {steps.map((s, i) => (
                            <div key={s.key} className={`tracking-step ${s.done ? 'done' : ''} ${s.current ? 'current' : ''}`}>
                              <div className="ts-icon">{s.done ? '✓' : (i + 1)}</div>
                              <div className="ts-label">{s.label}</div>
                              {i < steps.length - 1 && <div className={`ts-line ${s.done ? 'done' : ''}`} />}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Order Info */}
                    <div className="order-info-grid">
                      {o.customer && (
                        <div className="order-info-block">
                          <h5>{isAr ? 'بيانات الشحن' : 'Shipping info'}</h5>
                          {o.customer.name && <p><b>{isAr ? 'الاسم' : 'Name'}:</b> {o.customer.name}</p>}
                          {o.customer.phone && <p><b>{isAr ? 'الهاتف' : 'Phone'}:</b> {o.customer.phone}</p>}
                          {o.customer.city && <p><b>{isAr ? 'المدينة' : 'City'}:</b> {o.customer.city}</p>}
                          {o.customer.address && <p><b>{isAr ? 'العنوان' : 'Address'}:</b> {o.customer.address}</p>}
                        </div>
                      )}
                      <div className="order-info-block">
                        <h5>{isAr ? 'تفاصيل الطلب' : 'Order details'}</h5>
                        {(o.items || []).map((item, i) => (
                          <div key={i} className="order-detail-item">
                            <span>{item.name} ×{item.qty}</span>
                            <span>{item.price * item.qty} {isAr ? 'ج.م' : 'EGP'}</span>
                          </div>
                        ))}
                        <div className="order-detail-item order-detail-total">
                          <span>{isAr ? 'الإجمالي' : 'Total'}</span>
                          <span>{o.total} {isAr ? 'ج.م' : 'EGP'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
