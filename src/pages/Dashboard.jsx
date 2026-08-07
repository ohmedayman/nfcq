import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { toast } from '../components/Toast'
import { FIREBASE_READY } from '../firebase.config'
import { initProfileIfMissing, fetchProfile, saveProfile, uploadAvatar, listUserOrders } from '../lib/firebase'
import {
  IconUser, IconLink, IconCreditCard, IconCheck, IconPlus, IconRefresh, IconHome,
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
    // eslint-disable-next-line
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

  const url = `${window.location.origin}/u/${user.uid}`

  return (
    <section className="section">
      <div className="container dash">
        <aside className="dash-side">
          <h4>{isAr ? 'التحكم' : 'Menu'}</h4>
          <button className={`dash-link ${tab === 'profile' ? 'on' : ''}`} onClick={() => setTab('profile')}><IconUser /> {isAr ? 'الملف الشخصي' : 'Profile'}</button>
          <button className={`dash-link ${tab === 'social' ? 'on' : ''}`} onClick={() => setTab('social')}><IconLink /> {isAr ? 'السوشال' : 'Social'}</button>
          <button className={`dash-link ${tab === 'links' ? 'on' : ''}`} onClick={() => setTab('links')}><IconLink /> {isAr ? 'الروابط' : 'Links'}</button>
          <button className={`dash-link ${tab === 'orders' ? 'on' : ''}`} onClick={() => setTab('orders')}><IconCreditCard /> {isAr ? 'طلباتي' : 'Orders'}</button>
          <button className={`dash-link ${tab === 'nfc' ? 'on' : ''}`} onClick={() => setTab('nfc')}><IconRefresh /> {isAr ? 'بطاقة NFC' : 'NFC Card'}</button>
        </aside>

        <div className="panel">
          {tab === 'profile' && (
            <>
              <h3>{isAr ? 'الملف الشخصي' : 'Profile'}</h3>
              <p className="sub">{isAr ? 'بياناتك التي تظهر عند لمس البطاقة.' : 'Details shown when your card is tapped.'}</p>
              <AvatarUpload avatar={form.avatar} name={form.name || 'L'} uploading={uploading} onUpload={onUpload} isAr={isAr} />
              <div className="form-row">
                <div className="field"><label>{isAr ? 'الاسم' : 'Name'}</label><input value={form.name} onChange={setV('name')} /></div>
                <div className="field"><label>{isAr ? 'المهنة / الدور' : 'Role'}</label><input value={form.role} onChange={setV('role')} placeholder={isAr ? 'مصممة UX · مصورة' : 'UX Designer'} /></div>
              </div>
              <div className="form-row">
                <div className="field"><label>Email</label><input value={form.email} onChange={setV('email')} disabled /></div>
                <div className="field"><label>{isAr ? 'الهاتف' : 'Phone'}</label><input value={form.phone} onChange={setV('phone')} placeholder="+20 100 000 0000" /></div>
              </div>
              <div className="field"><label>{isAr ? 'نبذة عنك' : 'Bio'}</label><textarea value={form.bio} onChange={setV('bio')} /></div>
              <button className="btn btn-primary" onClick={save} disabled={saving}><IconCheck /> {saving ? '…' : (isAr ? 'حفظ التغييرات' : 'Save changes')}</button>
            </>
          )}

          {tab === 'social' && (
            <>
              <h3>{isAr ? 'السوشيال ميديا' : 'Social media'}</h3>
              <p className="sub">{isAr ? 'روابط منصاتك تظهر كأيقونات بصفحة البطاقة.' : 'Your network links appear as icons on your card page.'}</p>
              <RankingLink lbl="Instagram" ph="https://instagram.com/you" v={social.instagram} onChange={setS('instagram')} />
              <RankingLink lbl="LinkedIn" ph="https://linkedin.com/in/you" v={social.linkedin} onChange={setS('linkedin')} />
              <RankingLink lbl="X / Twitter" ph="https://x.com/you" v={social.twitter} onChange={setS('twitter')} />
              <RankingLink lbl="WhatsApp" ph="https://wa.me/201000000000" v={social.whatsapp} onChange={setS('whatsapp')} />
              <div style={{ height: 10 }} />
              <button className="btn btn-primary" onClick={save} disabled={saving}><IconCheck /> {saving ? '…' : (isAr ? 'حفظ' : 'Save')}</button>
            </>
          )}

          {tab === 'links' && (
            <>
              <h3>{isAr ? 'الروابط' : 'Links'}</h3>
              <p className="sub">{isAr ? 'روابطك تظهر كأزرار في صفحة البطاقة.' : 'Links appear as buttons on your card page.'}</p>
              {links.length === 0 && (
                <div className="empty"><div className="big">🔗</div>{isAr ? 'لا توجد روابط بعد. أضف أول رابط.' : 'No links yet. Add your first one.'}</div>
              )}
              {links.map((l, i) => (
                <div className="link-row" key={i} style={{ marginBottom: 10 }}>
                  <div className="field"><label>{isAr ? 'العنوان' : 'Label'}</label><input value={l.label} onChange={(e) => setLink(i, 'label', e.target.value)} placeholder={isAr ? 'أعمالي' : 'Portfolio'} /></div>
                  <div className="field"><label>URL</label><input value={l.url} onChange={(e) => setLink(i, 'url', e.target.value)} placeholder="https://" /></div>
                  <button className="link-del" onClick={() => delLink(i)}>✕</button>
                </div>
              ))}
              <button className="add-link" onClick={addLink}><IconPlus /> {isAr ? 'إضافة رابط' : 'Add link'}</button>
              <div style={{ height: 14 }} />
              <button className="btn btn-primary" onClick={save} disabled={saving}><IconCheck /> {saving ? '…' : (isAr ? 'حفظ' : 'Save')}</button>
            </>
          )}

          {tab === 'orders' && <Orders orders={orders} loadingOrders={loadingOrders} loadOrders={loadOrders} isAr={isAr} />}

          {tab === 'nfc' && (
            <>
              <h3>{isAr ? 'صفحة بطاقة NFC' : 'NFC Card page'}</h3>
              <p className="sub">{isAr ? 'الرابط الذي توجّه إليه البطاقة عند لمسها.' : 'The link your card points to when tapped.'}</p>
              <div className="meta-card">
                <div className="mc-on"><IconRefresh /></div>
                <div><b>{isAr ? 'رابط بطاقتك' : 'Your card link'}</b><span>{url}</span></div>
                <button className="copy-btn" onClick={() => { navigator.clipboard.writeText(url); toast(isAr ? 'تم النسخ ✓' : 'Copied ✓') }}>{isAr ? 'نسخ' : 'Copy'}</button>
              </div>
              <div style={{ height: 18 }} />
              <a className="btn btn-primary" href={url}><IconRefresh /> {isAr ? 'معاينة الصفحة' : 'Preview page'}</a>
            </>
          )}
        </div>
      </div>
    </section>
  )
}

function AvatarUpload({ avatar, name, uploading, onUpload, isAr }) {
  return (
    <div className="meta-card" style={{ marginBottom: 20 }}>
      <div className="mc-on" style={{ overflow: 'hidden' }}>
        {avatar ? <img src={avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : name.charAt(0)}
      </div>
      <div>
        <b>{isAr ? 'صورة البروفايل' : 'Profile photo'}</b>
        <div>
          <label className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: '0.85rem', cursor: 'pointer' }}>
            {uploading ? '…' : (isAr ? 'رفع صورة' : 'Upload')}
            <input type="file" accept="image/*" onChange={onUpload} style={{ display: 'none' }} />
          </label>
        </div>
      </div>
    </div>
  )
}

function RankingLink({ lbl, ph, v, onChange }) {
  return (
    <div className="field"><label>{lbl}</label><input value={v} onChange={onChange} placeholder={ph} dir="ltr" style={{ textAlign: 'left' }} /></div>
  )
}

function Orders({ orders, loading, loadOrders, isAr }) {
  const [touched, setTouched] = useState(false)
  const loadT = async () => { await loadOrders(); setTouched(true) }
  return (
    <>
      <h3>{isAr ? 'طلباتي' : 'My orders'}</h3>
      <p className="sub">{isAr ? 'تاريخ مشترياتك من المتجر.' : 'Your purchase history.'}</p>
      {!touched && !loading && <button className="btn btn-ghost" onClick={loadT}>{isAr ? 'عرض طلباتي' : 'Load my orders'}</button>}
      {loading ? <p style={{ color: 'var(--muted)', marginTop: 12 }}>{isAr ? 'جاري الجلب…' : 'Loading…'}</p> : null}
      {touched && !loading && orders.length === 0 && <div className="empty"><div className="big">📦</div>{isAr ? 'لا طلبات حتى الآن.' : 'No orders yet.'}</div>}
      {touched && !loading && orders.length > 0 && (
        <div className="admin-table" style={{ marginTop: 12 }}>
          <table>
            <thead><tr><th>#</th><th>{isAr ? 'المنتجات' : 'Items'}</th><th>{isAr ? 'الإجمالي' : 'Total'}</th><th>{isAr ? 'الحالة' : 'Status'}</th></tr></thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="mono">#{o.id.slice(0, 8)}</td>
                  <td>{(o.items || []).map((i) => `${i.name} ×${i.qty}`).join(', ')}</td>
                  <td className="money">{o.total}</td>
                  <td><span className={`status ${o.status || 'pending'}`}>{o.status || 'pending'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}