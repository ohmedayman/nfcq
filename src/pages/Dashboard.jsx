import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { toast } from '../components/Toast'
import { FIREBASE_READY } from '../firebase.config'
import { initProfileIfMissing, fetchProfile, saveProfile, uploadAvatar, listUserOrders } from '../lib/firebase'
import {
  IconUser, IconLink, IconCreditCard, IconCheck, IconPlus, IconRefresh, IconHome,
  IconInstagram, IconLinkedin, IconTwitter, IconWhatsApp, NfcIcon,
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
          setForm({ name: d.name || fallbackName, role: d.role || '', email: d.email || user.email || '', phone: d.phone || '', avatar: d.avatar || '' })
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
      toast(isAr ? 'تعذر رفع الصورة (فعّل Storage rules)' : 'Upload failed', 'error')
    }
    setUploading(false)
    e.target.value = ''
  }

  async function loadOrders() {
    setLoadingOrders(true)
    try { setOrders(await listUserOrders(user.uid)) } finally { setLoadingOrders(false) }
  }

  const setLink = (i, k, v) => setLinks((L) => L.map((it, idx) => (idx === i ? { ...it, [k]: v } : it)))
  const addLink = () => setLinks((L) => [...L, { label: '', url: '' }])
  const delLink = (i) => setLinks((L) => L.filter((_, idx) => idx !== i))

  if (loading) {
    return <section className="section"><div className="container" style={{ textAlign: 'center', color: 'var(--muted)' }}>{isAr ? 'جاري تحميل ملفك…' : 'Loading your profile…'}</div></section>
  }
  if (!FIREBASE_READY) {
    return <section className="section"><div className="container" style={{ textAlign: 'center', color: 'var(--muted)' }}>
      <div style={{ fontSize: 30, marginBottom: 8 }}>⚙️</div>
      {isAr ? 'Firebase لسه غير مربوطة — ضع مفاتيحك لفتح لوحة التحكم.' : 'Firebase not connected yet — add your keys to unlock the dashboard.'}
    </div></section>
  }

  const url = `${window.location.origin}/${window.location.hash ? '' : ''}#/u/${user.uid}`

  const tabs = [
    { id: 'profile', icon: <IconUser />, label: isAr ? 'الملف الشخصي' : 'Profile' },
    { id: 'social', icon: <IconLink />, label: isAr ? 'السوشال' : 'Social' },
    { id: 'links', icon: <IconRefresh />, label: isAr ? 'الروابط' : 'Links' },
    { id: 'orders', icon: <IconCreditCard />, label: isAr ? 'طلباتي' : 'Orders' },
    { id: 'nfc', icon: <NfcIcon />, label: isAr ? 'بطاقة NFC' : 'NFC Card' },
  ]

  return (
    <section className="section dash-section">
      <div className="container">
        {/* Header */}
        <div className="dash-header">
          <div>
            <h2 className="dash-title">{isAr ? 'لوحة التحكم' : 'Dashboard'}</h2>
            <p className="dash-sub">{isAr ? 'أدر ملفك الشخصي وبطاقتك' : 'Manage your profile and card'}</p>
          </div>
          <div className="dash-header-actions">
            <a href={url} target="_blank" rel="noreferrer" className="btn btn-ghost"><IconRefresh /> {isAr ? 'معاينة' : 'Preview'}</a>
          </div>
        </div>

        {/* Tabs */}
        <div className="dash-tabs">
          {tabs.map((t) => (
            <button key={t.id} className={`dash-tab ${tab === t.id ? 'on' : ''}`} onClick={() => setTab(t.id)}>
              {t.icon} <span>{t.label}</span>
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
                  <div className="field"><label>{isAr ? 'الاسم' : 'Name'}</label><input value={form.name} onChange={setV('name')} /></div>
                  <div className="field"><label>{isAr ? 'المهنة / الدور' : 'Role'}</label><input value={form.role} onChange={setV('role')} placeholder={isAr ? 'مصممة UX · مصورة' : 'UX Designer'} /></div>
                </div>
                <div className="form-row">
                  <div className="field"><label>Email</label><input value={form.email} onChange={setV('email')} disabled /></div>
                  <div className="field"><label>{isAr ? 'الهاتف' : 'Phone'}</label><input value={form.phone} onChange={setV('phone')} placeholder="+20 100 000 0000" /></div>
                </div>
                <div className="field"><label>{isAr ? 'نبذة عنك' : 'Bio'}</label><textarea value={form.bio} onChange={setV('bio')} rows={3} /></div>
                <button className="btn btn-primary" onClick={save} disabled={saving}><IconCheck /> {saving ? '…' : (isAr ? 'حفظ التغييرات' : 'Save changes')}</button>
              </div>
            )}

            {tab === 'social' && (
              <div className="dash-card">
                <div className="dash-card-header">
                  <h3>{isAr ? 'السوشيال ميديا' : 'Social media'}</h3>
                  <p>{isAr ? 'روابط منصاتك تظهر كأيقونات بصفحة البطاقة.' : 'Your network links appear as icons on your card page.'}</p>
                </div>
                <RankingLink icon={<IconInstagram />} lbl="Instagram" ph="https://instagram.com/you" v={social.instagram} onChange={setS('instagram')} />
                <RankingLink icon={<IconLinkedin />} lbl="LinkedIn" ph="https://linkedin.com/in/you" v={social.linkedin} onChange={setS('linkedin')} />
                <RankingLink icon={<IconTwitter />} lbl="X / Twitter" ph="https://x.com/you" v={social.twitter} onChange={setS('twitter')} />
                <RankingLink icon={<IconWhatsApp />} lbl="WhatsApp" ph="https://wa.me/201000000000" v={social.whatsapp} onChange={setS('whatsapp')} />
                <div style={{ height: 10 }} />
                <button className="btn btn-primary" onClick={save} disabled={saving}><IconCheck /> {saving ? '…' : (isAr ? 'حفظ' : 'Save')}</button>
              </div>
            )}

            {tab === 'links' && (
              <div className="dash-card">
                <div className="dash-card-header">
                  <h3>{isAr ? 'الروابط' : 'Links'}</h3>
                  <p>{isAr ? 'روابطك تظهر كأزرار في صفحة البطاقة.' : 'Links appear as buttons on your card page.'}</p>
                </div>
                {links.length === 0 && (
                  <div className="empty"><div className="big">🔗</div>{isAr ? 'لا توجد روابط بعد. أضف أول رابط.' : 'No links yet. Add your first one.'}</div>
                )}
                {links.map((l, i) => (
                  <div className="link-row" key={i}>
                    <div className="field"><label>{isAr ? 'العنوان' : 'Label'}</label><input value={l.label} onChange={(e) => setLink(i, 'label', e.target.value)} placeholder={isAr ? 'أعمالي' : 'Portfolio'} /></div>
                    <div className="field"><label>URL</label><input value={l.url} onChange={(e) => setLink(i, 'url', e.target.value)} placeholder="https://" /></div>
                    <button className="link-del" onClick={() => delLink(i)}>✕</button>
                  </div>
                ))}
                <button className="add-link" onClick={addLink}><IconPlus /> {isAr ? 'إضافة رابط' : 'Add link'}</button>
                <div style={{ height: 14 }} />
                <button className="btn btn-primary" onClick={save} disabled={saving}><IconCheck /> {saving ? '…' : (isAr ? 'حفظ' : 'Save')}</button>
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
                <a className="btn btn-ghost btn-block" href={url} target="_blank" rel="noreferrer"><IconRefresh /> {isAr ? 'معاينة الصفحة' : 'Preview page'}</a>
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
                  {form.avatar ? <img src={form.avatar} alt="" /> : (form.name || 'L').charAt(0).toUpperCase()}
                </div>
                <div className="preview-name">{form.name || (isAr ? 'اسمك' : 'Your Name')}</div>
                {form.role && <div className="preview-role">{form.role}</div>}
                {form.bio && <div className="preview-bio">{form.bio}</div>}

                <div className="preview-socials">
                  {social.instagram && <span className="ps-icon"><IconInstagram /></span>}
                  {social.linkedin && <span className="ps-icon"><IconLinkedin /></span>}
                  {social.twitter && <span className="ps-icon"><IconTwitter /></span>}
                  {social.whatsapp && <span className="ps-icon"><IconWhatsApp /></span>}
                </div>

                {links.filter(l => l.label || l.url).length > 0 && (
                  <div className="preview-links">
                    {links.filter(l => l.label || l.url).slice(0, 4).map((l, i) => (
                      <div key={i} className="preview-link">{l.label || l.url}</div>
                    ))}
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

function AvatarUpload({ avatar, name, uploading, onUpload, isAr }) {
  return (
    <div className="avatar-upload">
      <div className="avatar-preview">
        {avatar ? <img src={avatar} alt="avatar" /> : <span>{name.charAt(0)}</span>}
      </div>
      <div className="avatar-info">
        <b>{isAr ? 'صورة البروفايل' : 'Profile photo'}</b>
        <label className="btn btn-ghost btn-sm">
          {uploading ? '…' : (isAr ? 'رفع صورة' : 'Upload')}
          <input type="file" accept="image/*" onChange={onUpload} style={{ display: 'none' }} />
        </label>
      </div>
    </div>
  )
}

function RankingLink({ icon, lbl, ph, v, onChange }) {
  return (
    <div className="social-field">
      <div className="sf-icon">{icon}</div>
      <div className="sf-input">
        <label>{lbl}</label>
        <input value={v} onChange={onChange} placeholder={ph} dir="ltr" style={{ textAlign: 'left' }} />
      </div>
    </div>
  )
}

function Orders({ orders, loading, loadOrders, isAr }) {
  const [touched, setTouched] = useState(false)
  const loadT = async () => { await loadOrders(); setTouched(true) }
  return (
    <>
      {!touched && !loading && <button className="btn btn-ghost" onClick={loadT}>{isAr ? 'عرض طلباتي' : 'Load my orders'}</button>}
      {loading ? <p style={{ color: 'var(--muted)', marginTop: 12 }}>{isAr ? 'جاري الجلب…' : 'Loading…'}</p> : null}
      {touched && !loading && orders.length === 0 && <div className="empty"><div className="big">📦</div>{isAr ? 'لا طلبات حتى الآن.' : 'No orders yet.'}</div>}
      {touched && !loading && orders.length > 0 && (
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
