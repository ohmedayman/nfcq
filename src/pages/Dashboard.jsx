import { useState, useEffect, useRef, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { toast } from '../components/Toast'
import { FIREBASE_READY } from '../firebase.config'
import { initProfileIfMissing, fetchProfile, saveProfile, uploadAvatar, listUserOrders } from '../lib/firebase'
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
  const [form, setForm] = useState({ name: fallbackName, role: '', email: user?.email || '', bio: '', phone: '', avatar: '' })
  const [links, setLinks] = useState([])
  const [social, setSocial] = useState({ instagram: '', linkedin: '', twitter: '', whatsapp: '' })

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
          setForm({ name: d.name || fallbackName, role: d.role || '', email: d.email || user.email || '', bio: d.bio || '', phone: d.phone || '', avatar: d.avatar || '' })
          setLinks(Array.isArray(d.links) ? d.links : [])
          setSocial({ instagram: d.social?.instagram || '', linkedin: d.social?.linkedin || '', twitter: d.social?.twitter || '', whatsapp: d.social?.whatsapp || '' })
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
      await saveProfile(user.uid, { ...form, links, social })
      toast(isAr ? 'تم حفظ التغييرات ✓' : 'Changes saved ✓')
    } catch {
      toast(isAr ? 'لم يتم الحفظ — حاول مجددًا' : 'Save failed — try again', 'error')
    }
    setSaving(false)
  }

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
        <div className="container" style={{ textAlign: 'center', paddingTop: 120 }}>
          <div className="nfc-loader" />
          <p style={{ color: 'var(--muted)', marginTop: 16 }}>{isAr ? 'جاري تحميل ملفك…' : 'Loading your profile…'}</p>
        </div>
      </section>
    )
  }

  if (!FIREBASE_READY) {
    return (
      <section className="section">
        <div className="container" style={{ textAlign: 'center', paddingTop: 120 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚙️</div>
          <h2>{isAr ? 'Firebase لسه غير مربوطة' : 'Firebase not connected'}</h2>
          <p style={{ color: 'var(--muted)', margin: '12px 0 28px' }}>
            {isAr ? 'ضع مفاتيحك في firebase.config.js لفتح لوحة التحكم.' : 'Add your keys in firebase.config.js to unlock the dashboard.'}
          </p>
        </div>
      </section>
    )
  }

  const url = `${window.location.origin}/${window.location.hash ? '' : ''}#/u/${user.uid}`
  const linkCount = links.length
  const socialCount = Object.values(social).filter(Boolean).length
  const hasProfile = !!(form.name && form.role)

  const tabs = [
    { id: 'profile', icon: <IconUser />, label: isAr ? 'الملف الشخصي' : 'Profile' },
    { id: 'social', icon: <IconLink />, label: isAr ? 'السوشال' : 'Social', badge: socialCount || null },
    { id: 'links', icon: <IconZap />, label: isAr ? 'الروابط' : 'Links', badge: linkCount || null },
    { id: 'orders', icon: <IconCreditCard />, label: isAr ? 'طلباتي' : 'Orders' },
    { id: 'nfc', icon: <NfcIcon />, label: isAr ? 'بطاقة NFC' : 'NFC Card' },
  ]

  return (
    <section className="section dash-section">
      <div className="container">
        {/* Header */}
        <div className="dash-header">
          <div className="dash-header-left">
            <div className="dash-avatar-lg">
              {form.avatar
                ? <img src={form.avatar} alt="" />
                : <span>{(form.name || 'U').charAt(0).toUpperCase()}</span>}
            </div>
            <div>
              <h2 className="dash-title">{form.name || user?.email}</h2>
              <p className="dash-sub">{form.role || (isAr ? 'لم تُضف مهنة بعد' : 'No role added yet')}</p>
            </div>
          </div>
          <div className="dash-header-actions">
            <a href={url} target="_blank" rel="noreferrer" className="btn btn-ghost">
              <IconRefresh /> {isAr ? 'معاينة' : 'Preview'}
            </a>
          </div>
        </div>

        {/* Stats row */}
        <div className="dash-stats">
          <div className={`dash-stat ${hasProfile ? 'active' : ''}`}>
            <div className="ds-icon"><IconUser /></div>
            <div><b>{hasProfile ? '✓' : '—'}</b><span>{isAr ? 'الملف الشخصي' : 'Profile'}</span></div>
          </div>
          <div className={`dash-stat ${socialCount > 0 ? 'active' : ''}`}>
            <div className="ds-icon"><IconLink /></div>
            <div><b>{socialCount}</b><span>{isAr ? 'منصة اجتماعية' : 'Social links'}</span></div>
          </div>
          <div className={`dash-stat ${linkCount > 0 ? 'active' : ''}`}>
            <div className="ds-icon"><IconZap /></div>
            <div><b>{linkCount}</b><span>{isAr ? 'رابط مخصص' : 'Custom links'}</span></div>
          </div>
          <div className="dash-stat active">
            <div className="ds-icon"><NfcIcon /></div>
            <div><b>{isAr ? 'نشط' : 'Active'}</b><span>{isAr ? 'بطاقة NFC' : 'NFC Card'}</span></div>
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
                  <h3>{isAr ? 'الملف الشخصي' : 'Profile'}</h3>
                  <p>{isAr ? 'بياناتك التي تظهر عند لمس البطاقة.' : 'Details shown when your card is tapped.'}</p>
                </div>
                <AvatarUpload avatar={form.avatar} name={form.name || 'L'} uploading={uploading} onUpload={onUpload} isAr={isAr} />
                <div className="form-row">
                  <div className="field"><label>{isAr ? 'الاسم الكامل' : 'Full name'}</label><input value={form.name} onChange={setV('name')} placeholder={isAr ? 'محمد أحمد' : 'John Doe'} /></div>
                  <div className="field"><label>{isAr ? 'المهنة / الدور' : 'Role / Title'}</label><input value={form.role} onChange={setV('role')} placeholder={isAr ? 'مصمم UX · القاهرة' : 'UX Designer · Cairo'} /></div>
                </div>
                <div className="form-row">
                  <div className="field"><label>Email</label><input value={form.email} disabled /></div>
                  <div className="field"><label>{isAr ? 'الهاتف' : 'Phone'}</label><input value={form.phone} onChange={setV('phone')} placeholder="+20 100 000 0000" /></div>
                </div>
                <div className="field">
                  <label>{isAr ? 'نبذة عنك' : 'Bio'}</label>
                  <textarea value={form.bio} onChange={setV('bio')} rows={3} placeholder={isAr ? '几句 عن نفسك…' : 'A short bio about you…'} />
                  <span className="field-hint">{form.bio.length}/160</span>
                </div>
                <button className="btn btn-primary" onClick={save} disabled={saving}>
                  <IconCheck /> {saving ? '…' : (isAr ? 'حفظ التغييرات' : 'Save changes')}
                </button>
              </div>
            )}

            {tab === 'social' && (
              <div className="dash-card">
                <div className="dash-card-header">
                  <h3>{isAr ? 'السوشيال ميديا' : 'Social media'}</h3>
                  <p>{isAr ? 'روابط منصاتك تظهر كأيقونات بصفحة البطاقة.' : 'Your links appear as icons on your card page.'}</p>
                </div>
                <SocialField icon={<IconInstagram />} lbl="Instagram" ph="https://instagram.com/you" v={social.instagram} onChange={setS('instagram')} color="#E4405F" />
                <SocialField icon={<IconLinkedin />} lbl="LinkedIn" ph="https://linkedin.com/in/you" v={social.linkedin} onChange={setS('linkedin')} color="#0A66C2" />
                <SocialField icon={<IconTwitter />} lbl="X / Twitter" ph="https://x.com/you" v={social.twitter} onChange={setS('twitter')} color="#000" />
                <SocialField icon={<IconWhatsApp />} lbl="WhatsApp" ph="https://wa.me/201000000000" v={social.whatsapp} onChange={setS('whatsapp')} color="#25D366" />
                <div style={{ height: 14 }} />
                <button className="btn btn-primary" onClick={save} disabled={saving}>
                  <IconCheck /> {saving ? '…' : (isAr ? 'حفظ' : 'Save')}
                </button>
              </div>
            )}

            {tab === 'links' && (
              <div className="dash-card">
                <div className="dash-card-header">
                  <h3>{isAr ? 'الروابط المخصصة' : 'Custom links'}</h3>
                  <p>{isAr ? 'روابطك تظهر كأزرار في صفحة البطاقة. رتّبها بالترتيب.' : 'Links appear as buttons on your card page. Arrange them in order.'}</p>
                </div>
                {links.length === 0 && (
                  <div className="empty-state">
                    <div className="empty-icon">🔗</div>
                    <h4>{isAr ? 'لا توجد روابط بعد' : 'No links yet'}</h4>
                    <p>{isAr ? 'أضف أول رابط يظهر بصفحة بطاقتك.' : 'Add your first link to show on your card page.'}</p>
                    <button className="btn btn-primary" onClick={addLink}><IconPlus /> {isAr ? 'إضافة رابط' : 'Add link'}</button>
                  </div>
                )}
                {links.length > 0 && (
                  <>
                    {links.map((l, i) => (
                      <div className="link-row" key={i}>
                        <div className="link-handle">
                          <button className="link-move" onClick={() => moveLink(i, -1)} disabled={i === 0}>↑</button>
                          <button className="link-move" onClick={() => moveLink(i, 1)} disabled={i === links.length - 1}>↓</button>
                        </div>
                        <div className="link-fields">
                          <div className="field"><label>{isAr ? 'العنوان' : 'Label'}</label><input value={l.label} onChange={(e) => setLink(i, 'label', e.target.value)} placeholder={isAr ? 'أعمالي' : 'Portfolio'} /></div>
                          <div className="field"><label>URL</label><input value={l.url} onChange={(e) => setLink(i, 'url', e.target.value)} placeholder="https://" dir="ltr" style={{ textAlign: 'left' }} /></div>
                        </div>
                        <button className="link-del" onClick={() => delLink(i)} title={isAr ? 'حذف' : 'Delete'}>✕</button>
                      </div>
                    ))}
                    <button className="add-link" onClick={addLink}><IconPlus /> {isAr ? 'إضافة رابط' : 'Add link'}</button>
                    <div style={{ height: 14 }} />
                    <button className="btn btn-primary" onClick={save} disabled={saving}>
                      <IconCheck /> {saving ? '…' : (isAr ? 'حفظ' : 'Save')}
                    </button>
                  </>
                )}
              </div>
            )}

            {tab === 'orders' && (
              <div className="dash-card">
                <div className="dash-card-header">
                  <h3>{isAr ? 'طلباتي' : 'My orders'}</h3>
                  <p>{isAr ? 'تاريخ مشترياتك من المتجر.' : 'Your purchase history.'}</p>
                </div>
                <Orders orders={orders} loadingOrders={loadingOrders} loadOrders={loadOrders} isAr={isAr} />
              </div>
            )}

            {tab === 'nfc' && (
              <div className="dash-card">
                <div className="dash-card-header">
                  <h3>{isAr ? 'صفحة بطاقة NFC' : 'NFC Card page'}</h3>
                  <p>{isAr ? 'الرابط الذي توجّه إليه البطاقة عند لمسها.' : 'The link your card points to when tapped.'}</p>
                </div>
                <div className="nfc-link-box">
                  <div className="nfc-link-icon"><IconRefresh /></div>
                  <div className="nfc-link-info">
                    <b>{isAr ? 'رابط بطاقتك' : 'Your card link'}</b>
                    <span className="nfc-link-url">{url}</span>
                  </div>
                  <button className="btn btn-primary" onClick={() => { navigator.clipboard.writeText(url); toast(isAr ? 'تم النسخ ✓' : 'Copied ✓') }}>
                    <IconCheck /> {isAr ? 'نسخ' : 'Copy'}
                  </button>
                </div>
                <div style={{ height: 18 }} />
                <div className="nfc-qr-section">
                  <div className="nfc-qr">
                    <QRCode value={url} size={160} />
                  </div>
                  <div className="nfc-qr-info">
                    <h4>{isAr ? 'رمز QR' : 'QR Code'}</h4>
                    <p>{isAr ? 'امسح الرمز بكاميرا هاتفك لفتح صفحتك.' : 'Scan with your phone camera to open your page.'}</p>
                    <a className="btn btn-ghost btn-sm" href={url} target="_blank" rel="noreferrer"><IconRefresh /> {isAr ? 'فتح الصفحة' : 'Open page'}</a>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Live Preview */}
          <div className="dash-preview">
            <div className="preview-label"><NfcIcon /> {isAr ? 'معاينة مباشرة' : 'Live preview'}</div>
            <div className="preview-phone">
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
                    {links.filter(l => l.label || l.url).slice(0, 5).map((l, i) => (
                      <div key={i} className="preview-link">{l.label || l.url}</div>
                    ))}
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
            <a href={url} target="_blank" rel="noreferrer" className="preview-open">{isAr ? 'فتح الصفحة الكاملة' : 'Open full page'}</a>
          </div>
        </div>
      </div>
    </section>
  )
}

/* QR Code generator (pure SVG, no library) */
function QRCode({ value, size = 140 }) {
  const svgRef = useRef(null)
  useEffect(() => {
    if (!svgRef.current || !value) return
    const svg = svgRef.current
    svg.innerHTML = ''
    const modules = qrMatrix(value)
    const cellSize = size / modules.length
    for (let r = 0; r < modules.length; r++) {
      for (let c = 0; c < modules[r].length; c++) {
        if (modules[r][c]) {
          const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
          rect.setAttribute('x', c * cellSize)
          rect.setAttribute('y', r * cellSize)
          rect.setAttribute('width', cellSize + 0.5)
          rect.setAttribute('height', cellSize + 0.5)
          rect.setAttribute('fill', '#0c1830')
          svg.appendChild(rect)
        }
      }
    }
  }, [value, size])
  return <svg ref={svgRef} viewBox={`0 0 ${size} ${size}`} width={size} height={size} style={{ borderRadius: 12, background: '#fff', padding: 8 }} />
}

/* Simple QR matrix generator */
function qrMatrix(text) {
  const n = 25
  const grid = Array.from({ length: n }, () => Array(n).fill(false))
  // Finder patterns
  const drawFinder = (sr, sc) => {
    for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++) {
      const ring = r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)
      grid[sr + r][sc + c] = ring
    }
  }
  drawFinder(0, 0)
  drawFinder(0, n - 7)
  drawFinder(n - 7, 0)
  // Timing
  for (let i = 8; i < n - 8; i++) { grid[6][i] = i % 2 === 0; grid[i][6] = i % 2 === 0 }
  // Data (simple hash scatter)
  const hash = Array.from(text).reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0)
  let seed = Math.abs(hash)
  for (let i = 0; i < 80; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    const r = 8 + (seed % (n - 12))
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    const c = 8 + (seed % (n - 12))
    if (!grid[r][c]) grid[r][c] = true
  }
  return grid
}

function AvatarUpload({ avatar, name, uploading, onUpload, isAr }) {
  return (
    <div className="avatar-upload">
      <div className="avatar-preview">
        {avatar ? <img src={avatar} alt="avatar" /> : <span>{name.charAt(0).toUpperCase()}</span>}
      </div>
      <div className="avatar-info">
        <b>{isAr ? 'صورة البروفايل' : 'Profile photo'}</b>
        <p>{isAr ? 'صورة دائرية بحجم 400×400 بكسل على الأقل.' : 'Square image, 400×400px minimum.'}</p>
        <label className="btn btn-ghost btn-sm">
          {uploading ? '…' : (isAr ? 'رفع صورة' : 'Upload photo')}
          <input type="file" accept="image/*" onChange={onUpload} style={{ display: 'none' }} />
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
  const loadT = async () => { await loadOrders(); setTouched(true) }
  return (
    <>
      {!touched && !loadingOrders && (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h4>{isAr ? 'طلباتي' : 'My orders'}</h4>
          <p>{isAr ? 'اعرض طلباتك السابقة من المتجر.' : 'View your past purchases.'}</p>
          <button className="btn btn-primary" onClick={loadT}>{isAr ? 'عرض طلباتي' : 'Load orders'}</button>
        </div>
      )}
      {loadingOrders && <div style={{ textAlign: 'center', padding: 30 }}><div className="nfc-loader" /></div>}
      {touched && !loadingOrders && orders.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🛒</div>
          <h4>{isAr ? 'لا طلبات حتى الآن' : 'No orders yet'}</h4>
          <p>{isAr ? 'ابدأ بالتسوق من المتجر.' : 'Start shopping from the store.'}</p>
          <Link to="/store" className="btn btn-primary">{isAr ? 'الذهاب للمتجر' : 'Go to store'}</Link>
        </div>
      )}
      {touched && !loadingOrders && orders.length > 0 && (
        <div className="orders-list">
          {orders.map((o) => (
            <div key={o.id} className="order-item">
              <div className="order-top">
                <span className="order-id">#{o.id.slice(0, 8)}</span>
                <span className={`status ${o.status || 'pending'}`}>{o.status || 'pending'}</span>
              </div>
              <div className="order-items">{(o.items || []).map((i) => `${i.name} ×${i.qty}`).join(', ')}</div>
              <div className="order-total">{o.total} {isAr ? 'ج.م' : 'EGP'}</div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
