import { useState, useEffect, useRef, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { toast } from '../components/Toast'
import { FIREBASE_READY } from '../firebase.config'
import { initProfileIfMissing, fetchProfile, saveProfile, uploadAvatar, listUserOrders } from '../lib/firebase'
import { normalizeUrl, normalizeSocialUrl, detectPlatformInfo, CARD_THEMES } from '../lib/utils'
import {
  IconUser, IconLink, IconCreditCard, IconCheck, IconPlus, IconRefresh, IconHome,
  IconInstagram, IconLinkedin, IconTwitter, IconWhatsApp, IconShield, IconZap, NfcIcon,
  IconYouTube, IconFacebook, IconTikTok, IconTelegram, IconSnapchat, IconSpotify, IconDiscord,
  PlatformIcon, IconVerified, IconShare, IconDots,
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
  const [social, setSocial] = useState({
    instagram: '',
    whatsapp: '',
    facebook: '',
    youtube: '',
    tiktok: '',
    telegram: '',
    twitter: '',
    linkedin: '',
    snapchat: '',
    spotify: '',
  })
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
        const initialForm = {
          name: d?.name || fallbackName,
          role: d?.role || '',
          email: d?.email || user.email || '',
          bio: d?.bio || '',
          phone: d?.phone || '',
          avatar: d?.avatar || '',
          theme: d?.theme || 'default',
        }
        setForm(initialForm)
        setLinks(Array.isArray(d?.links) ? d.links : [])
        setSocial({
          instagram: d?.social?.instagram || '',
          whatsapp: d?.social?.whatsapp || '',
          facebook: d?.social?.facebook || '',
          youtube: d?.social?.youtube || '',
          tiktok: d?.social?.tiktok || '',
          telegram: d?.social?.telegram || '',
          twitter: d?.social?.twitter || '',
          linkedin: d?.social?.linkedin || '',
          snapchat: d?.social?.snapchat || '',
          spotify: d?.social?.spotify || '',
        })
        const isAct = d?.activated === true
        setActivated(isAct)

        // Save local cache with exact activation status
        saveProfile(user.uid, { ...initialForm, activated: isAct }).catch(() => {})
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [user])

  async function save() {
    setSaving(true)
    try {
      const normalizedSocial = {}
      for (const [k, v] of Object.entries(social)) {
        normalizedSocial[k] = normalizeSocialUrl(k, v)
      }
      const normalizedLinks = links.map((l) => ({
        label: l.label || '',
        url: normalizeUrl(l.url),
        subtitle: l.subtitle || '',
      }))
      await saveProfile(user.uid, { ...form, links: normalizedLinks, social: normalizedSocial })
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
    try {
      const ords = await listUserOrders(user.uid)
      setOrders(ords || [])
    } catch {
      setOrders([])
    }
    setLoadingOrders(false)
  }

  useEffect(() => {
    if (tab === 'orders') loadOrders()
  }, [tab])

  function addLink() {
    setLinks((l) => [...l, { label: '', url: '', subtitle: '' }])
  }

  function updateLink(idx, key, val) {
    setLinks((l) => l.map((item, i) => (i === idx ? { ...item, [key]: val } : item)))
  }

  function delLink(idx) {
    setLinks((l) => l.filter((_, i) => i !== idx))
  }

  function moveLink(idx, dir) {
    const target = idx + dir
    if (target < 0 || target >= links.length) return
    setLinks((l) => {
      const arr = [...l]
      const [item] = arr.splice(idx, 1)
      arr.splice(target, 0, item)
      return arr
    })
  }

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
        {/* Activation Banner */}
        {!activated && (
          <div className="dash-alert-banner" style={{ marginBottom: 24, borderLeft: '4px solid #f59e0b', background: 'rgba(245, 158, 11, 0.08)' }}>
            <div className="dash-alert-icon" style={{ fontSize: '2rem' }}>💳</div>
            <div className="dash-alert-body" style={{ flex: 1 }}>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)' }}>
                {isAr ? 'حسابك في وضع المعاينة — البطاقة الذكية غير مفعلة' : 'Preview Mode — NFC Card Not Activated'}
              </h4>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--muted)' }}>
                {isAr 
                  ? 'صفحتك الرقمية جاهزة للمعاينة. اشترِ بطاقتك الذكية (NFC Card) الآن من المتجر لتفعيل حسابك بشكل رسمي وشحن البطاقة إليك.' 
                  : 'Your profile is ready in preview mode. Purchase your smart NFC card to officially activate your account and have it shipped.'}
              </p>
            </div>
            <Link to="/store" className="btn btn-primary btn-sm">
              {isAr ? '🛒 شراء البطاقة وتفعيل الحساب' : '🛒 Buy Card & Activate'}
            </Link>
          </div>
        )}

        <div className="dash-header">
          <div className="dash-header-left">
            <div className="dash-avatar-lg">
              {form.avatar
                ? <img src={form.avatar} alt="" />
                : <span>{(form.name || 'U').charAt(0).toUpperCase()}</span>}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <h2 className="dash-title" style={{ margin: 0 }}>{form.name || user?.email}</h2>
                <IconVerified size="1.2em" />
              </div>
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
          <div className={`dash-stat ${activated ? 'active' : 'inactive'}`}>
            <div className="ds-icon"><NfcIcon /></div>
            <div>
              <b>{activated ? (isAr ? 'مفعلة ✓' : 'Active ✓') : (isAr ? 'قيد الانتظار' : 'Pending')}</b>
              <span>{isAr ? 'حالة البطاقة' : 'Card status'}</span>
            </div>
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
                  <div className="field"><label>{isAr ? 'المهنة / الدور' : 'Role / Title'}</label><input value={form.role} onChange={setV('role')} placeholder={isAr ? 'مبرمج مواقع · القاهرة' : 'Web Developer · Cairo'} /></div>
                </div>
                <div className="form-row">
                  <div className="field"><label>Email</label><input value={form.email} disabled /></div>
                  <div className="field"><label>{isAr ? 'التليفون' : 'Phone'}</label><input value={form.phone} onChange={setV('phone')} placeholder="+20 100 000 0000" /></div>
                </div>
                <div className="field">
                  <label>{isAr ? 'عن نفسك' : 'Bio'}</label>
                  <textarea value={form.bio} onChange={setV('bio')} rows={3} placeholder={isAr ? 'نبذة عن نفسك…' : 'A short bio about you…'} />
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
                  <h3>{isAr ? 'منصات التواصل الاجتماعي 🌐' : 'Social Media Channels 🌐'}</h3>
                  <p>{isAr ? 'أضف حساباتك لتظهر كأيقونات رسمية ملونة في أعلى صفحتك مثل كبار المشاهير.' : 'Add your social handles to display as verified colored brand icons.'}</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
                  <SocialField icon={<IconYouTube />} lbl="YouTube" ph="https://youtube.com/@channel" v={social.youtube} onChange={setS('youtube')} color="#FF0000" />
                  <SocialField icon={<IconFacebook />} lbl="Facebook" ph="https://facebook.com/page" v={social.facebook} onChange={setS('facebook')} color="#1877F2" />
                  <SocialField icon={<IconTikTok />} lbl="TikTok" ph="https://tiktok.com/@user" v={social.tiktok} onChange={setS('tiktok')} color="#000000" />
                  <SocialField icon={<IconTelegram />} lbl="Telegram" ph="https://t.me/username" v={social.telegram} onChange={setS('telegram')} color="#229ED9" />
                  <SocialField icon={<IconWhatsApp />} lbl="WhatsApp" ph="https://wa.me/201000000000" v={social.whatsapp} onChange={setS('whatsapp')} color="#25D366" />
                  <SocialField icon={<IconInstagram />} lbl="Instagram" ph="https://instagram.com/you" v={social.instagram} onChange={setS('instagram')} color="#E4405F" />
                  <SocialField icon={<IconLinkedin />} lbl="LinkedIn" ph="https://linkedin.com/in/you" v={social.linkedin} onChange={setS('linkedin')} color="#0A66C2" />
                  <SocialField icon={<IconTwitter />} lbl="X / Twitter" ph="https://x.com/you" v={social.twitter} onChange={setS('twitter')} color="#000000" />
                  <SocialField icon={<IconSnapchat />} lbl="Snapchat" ph="https://snapchat.com/add/you" v={social.snapchat} onChange={setS('snapchat')} color="#eab308" />
                  <SocialField icon={<IconSpotify />} lbl="Spotify" ph="https://open.spotify.com/..." v={social.spotify} onChange={setS('spotify')} color="#1DB954" />
                </div>
                <div style={{ height: 16 }} />
                <button className="btn btn-primary" onClick={save} disabled={saving}>
                  <IconCheck /> {saving ? '…' : (isAr ? 'سيڤ التغييرات' : 'Save changes')}
                </button>
              </div>
            )}

            {tab === 'links' && (
              <div className="dash-card">
                <div className="dash-card-header">
                  <h3>{isAr ? 'الروابط الذكية المخصصة ⚡' : 'Smart Rich Links ⚡'}</h3>
                  <p>{isAr ? 'أضف روابطك (قنواتك، كتبك، متجرك، خدماتك). يتم التعرف على الأيقونة تلقائياً ويمكنك إضافة وصف فرعي لكل رابط!' : 'Add your links with auto-detected platform icons and subtitles!'}</p>
                </div>
                {links.length === 0 && (
                  <div className="empty-state">
                    <div className="empty-icon"><IconZap /></div>
                    <h4>{isAr ? 'لسه مفيش روابط' : 'No links yet'}</h4>
                    <p>{isAr ? 'أضف أول رابط ليظهر في صفحتك بأسلوب Linktree الاحترافي.' : 'Add your first link to display on your digital card.'}</p>
                    <button className="btn btn-primary" onClick={addLink}><IconPlus /> {isAr ? 'أضف رابط جديد' : 'Add Link'}</button>
                  </div>
                )}
                {links.length > 0 && (
                  <>
                    {links.map((l, i) => {
                      const detected = detectPlatformInfo(l.url, l.label)
                      return (
                        <div className="link-card-editor" key={i} style={{ borderInlineStart: `4px solid ${detected.color || '#6366f1'}` }}>
                          <div className="link-card-num" style={{ background: detected.color || 'var(--card)', color: '#fff' }} title={detected.label}>
                            <PlatformIcon name={detected.icon} />
                          </div>
                          <div className="link-card-fields" style={{ flex: 1 }}>
                            <div className="form-row" style={{ gap: 10, marginBottom: 8 }}>
                              <div className="field" style={{ flex: 1 }}>
                                <label>{isAr ? 'عنوان الرابط (الرئيسي)' : 'Main Title'}</label>
                                <input value={l.label} onChange={(e) => updateLink(i, 'label', e.target.value)} placeholder={isAr ? 'مثال: منصة دكتور محمد أيمن' : 'e.g. My Online Academy'} />
                              </div>
                              <div className="field" style={{ flex: 1 }}>
                                <label>{isAr ? 'وصف فرعي (اختياري)' : 'Subtitle (Optional)'}</label>
                                <input value={l.subtitle || ''} onChange={(e) => updateLink(i, 'subtitle', e.target.value)} placeholder={isAr ? 'مثال: 2.2M Subscribers / متاح الشحن' : 'e.g. 2.2M Subscribers / Fast delivery'} />
                              </div>
                            </div>
                            <div className="field">
                              <label>URL</label>
                              <input value={l.url} onChange={(e) => updateLink(i, 'url', e.target.value)} placeholder="https://youtube.com/... أو https://wa.me/..." dir="ltr" style={{ textAlign: 'left' }} />
                            </div>
                          </div>
                          <div className="link-card-actions">
                            <button className="link-move-btn" onClick={() => moveLink(i, -1)} disabled={i === 0} title={isAr ? 'تحريك لأعلى' : 'Move up'}>↑</button>
                            <button className="link-move-btn" onClick={() => moveLink(i, 1)} disabled={i === links.length - 1} title={isAr ? 'تحريك لأسفل' : 'Move down'}>↓</button>
                            <button className="link-del-btn" onClick={() => delLink(i)} title={isAr ? 'حذف' : 'Delete'}>✕</button>
                          </div>
                        </div>
                      )
                    })}
                    <button className="add-link" onClick={addLink}><IconPlus /> {isAr ? 'أضف رابط جديد' : 'Add link'}</button>
                    <div style={{ height: 14 }} />
                    <button className="btn btn-primary" onClick={save} disabled={saving}>
                      <IconCheck /> {saving ? '…' : (isAr ? 'سيڤ التغييرات' : 'Save changes')}
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

                {!activated ? (
                  <div style={{ padding: '16px 20px', background: 'rgba(245, 158, 11, 0.08)', border: '1.5px solid rgba(245, 158, 11, 0.25)', borderRadius: 16, marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
                      <div>
                        <b style={{ color: '#d97706', fontSize: '0.98rem' }}>{isAr ? '⚠️ بطاقتك الذكية غير مفعلة (وضع المعاينة)' : '⚠️ NFC Card Inactive (Preview Mode)'}</b>
                        <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: 'var(--muted)' }}>
                          {isAr ? 'صفحتك الرقمية جاهزة وتعمل في وضع المعاينة. اطلب بطاقتك المطبوعة الآن لتفعيل الربط والشحن المباشر.' : 'Your profile is live in preview mode. Order your physical card from the store to activate shipping & hardware link.'}
                        </p>
                      </div>
                      <Link to="/store" className="btn btn-primary btn-sm">{isAr ? '🛒 اطلب بطاقتك الآن' : '🛒 Order Card'}</Link>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '14px 18px', background: 'rgba(16, 185, 129, 0.08)', border: '1.5px solid rgba(16, 185, 129, 0.25)', borderRadius: 16, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: '1.4rem' }}>✅</span>
                    <div>
                      <b style={{ color: '#059669', fontSize: '0.95rem' }}>{isAr ? 'بطاقتك الذكية مفعلة رسمياً' : 'Your Smart Card is Officially Active'}</b>
                      <p style={{ margin: '2px 0 0', fontSize: '0.84rem', color: 'var(--muted)' }}>{isAr ? 'تم ربط بطاقتك بنجاح بملفك الشخصي.' : 'Your card is connected to your profile.'}</p>
                    </div>
                  </div>
                )}

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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, margin: '8px 0 2px' }}>
                  <div className="preview-name" style={{ margin: 0 }}>{form.name || (isAr ? 'اسمك' : 'Your Name')}</div>
                  <IconVerified size="1.05em" />
                </div>
                {form.role && <div className="preview-role">{form.role}</div>}
                {form.bio && <div className="preview-bio">{form.bio}</div>}

                <div className="preview-socials" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', margin: '10px 0' }}>
                  {social.youtube && <span className="ps-icon" style={{ background: '#FF0000', color: '#fff' }}><IconYouTube /></span>}
                  {social.facebook && <span className="ps-icon" style={{ background: '#1877F2', color: '#fff' }}><IconFacebook /></span>}
                  {social.tiktok && <span className="ps-icon" style={{ background: '#000000', color: '#fff' }}><IconTikTok /></span>}
                  {social.telegram && <span className="ps-icon" style={{ background: '#229ED9', color: '#fff' }}><IconTelegram /></span>}
                  {social.whatsapp && <span className="ps-icon" style={{ background: '#25D366', color: '#fff' }}><IconWhatsApp /></span>}
                  {social.instagram && <span className="ps-icon" style={{ background: '#E4405F', color: '#fff' }}><IconInstagram /></span>}
                  {social.linkedin && <span className="ps-icon" style={{ background: '#0A66C2', color: '#fff' }}><IconLinkedin /></span>}
                  {social.twitter && <span className="ps-icon" style={{ background: '#000000', color: '#fff' }}><IconTwitter /></span>}
                  {social.snapchat && <span className="ps-icon" style={{ background: '#eab308', color: '#000' }}><IconSnapchat /></span>}
                  {social.spotify && <span className="ps-icon" style={{ background: '#1DB954', color: '#fff' }}><IconSpotify /></span>}
                </div>

                {links.filter(l => l.label || l.url).length > 0 && (
                  <div className="preview-links" style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                    {links.filter(l => l.label || l.url).slice(0, 6).map((l, i) => {
                      const detected = detectPlatformInfo(l.url, l.label)
                      return (
                        <div key={i} className="preview-link" style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '7px 10px',
                          borderRadius: 12,
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          textAlign: isAr ? 'right' : 'left',
                        }}>
                          <div style={{
                            width: 26,
                            height: 26,
                            borderRadius: 7,
                            background: detected.color || '#6366f1',
                            color: '#fff',
                            display: 'grid',
                            placeItems: 'center',
                            fontSize: '0.8rem',
                            flexShrink: 0,
                          }}>
                            <PlatformIcon name={detected.icon} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                            <div style={{ fontWeight: 800, fontSize: '0.78rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', color: '#fff' }}>
                              {l.label || l.url}
                            </div>
                            {l.subtitle && (
                              <div style={{ fontSize: '0.68rem', opacity: 0.7, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', color: '#cbd5e1' }}>
                                {l.subtitle}
                              </div>
                            )}
                          </div>
                          <span style={{ opacity: 0.5, fontSize: '0.75rem' }}>{isAr ? '←' : '→'}</span>
                        </div>
                      )
                    })}
                  </div>
                )}

                {(form.phone || form.email) && (
                  <div className="preview-contact" style={{ marginTop: 12 }}>
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
