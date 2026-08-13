import { useState, useEffect, useRef, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { toast } from '../components/Toast'
import { FIREBASE_READY } from '../firebase.config'
import {
  initProfileIfMissing, fetchProfile, saveProfile, uploadAvatar,
  listUserOrders, listLeads, getProfileAnalytics
} from '../lib/firebase'
import { normalizeUrl, normalizeSocialUrl, detectPlatformInfo, CARD_THEMES, sanitizeProfileData } from '../lib/utils'
import {
  IconUser, IconLink, IconCreditCard, IconCheck, IconPlus, IconRefresh, IconHome,
  IconInstagram, IconLinkedin, IconTwitter, IconWhatsApp, IconShield, IconZap, NfcIcon,
  IconYouTube, IconFacebook, IconTikTok, IconTelegram, IconSnapchat, IconSpotify, IconDiscord,
  PlatformIcon, IconVerified, IconShare, IconDots, IconPhone, IconMail
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
  const [leads, setLeads] = useState([])
  const [analytics, setAnalytics] = useState({ totalViews: 0, totalClicks: 0, clicksBreakdown: {} })

  const fallbackName = user?.displayName || (user?.email || '').split('@')[0]
  const fallbackUsername = (user?.displayName || (user?.email || '').split('@')[0]).toLowerCase().replace(/[^a-z0-9_]/g, '')
  const [form, setForm] = useState({
    name: fallbackName,
    username: fallbackUsername,
    role: '',
    email: user?.email || '',
    bio: '',
    phone: '',
    avatar: '',
    theme: 'default',
  })
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

  async function loadLeadsData() {
    if (user?.uid) {
      try {
        const l = await listLeads(user.uid)
        setLeads(l)
      } catch {}
    }
  }

  async function loadAnalyticsData() {
    if (user?.uid) {
      try {
        const a = await getProfileAnalytics(user.uid)
        setAnalytics(a)
      } catch {}
    }
  }

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
            username: d.username || fallbackUsername,
            role: d.role || '',
            email: d.email || user.email || '',
            bio: d.bio || '',
            phone: d.phone || '',
            avatar: d.avatar || '',
            theme: d.theme || 'default',
          })
          setLinks(Array.isArray(d.links) ? d.links : [])
          setSocial({
            instagram: d.social?.instagram || '',
            whatsapp: d.social?.whatsapp || '',
            facebook: d.social?.facebook || '',
            youtube: d.social?.youtube || '',
            tiktok: d.social?.tiktok || '',
            telegram: d.social?.telegram || '',
            twitter: d.social?.twitter || '',
            linkedin: d.social?.linkedin || '',
            snapchat: d.social?.snapchat || '',
            spotify: d.social?.spotify || '',
          })
          setActivated(d.activated === true)
        }
        await loadLeadsData()
        await loadAnalyticsData()
      } catch (err) {
        console.error('[Dashboard] Error fetching profile:', err)
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
      const cleanData = sanitizeProfileData({ ...form, links: normalizedLinks, social: normalizedSocial })
      await saveProfile(user.uid, cleanData)
      setSocial(cleanData.social || {})
      setLinks(cleanData.links || [])
      toast(isAr ? 'تم حفظ التغييرات المشفرة والآمنة ✓' : 'Changes saved securely ✓')
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
      toast(isAr ? 'تم رفع الصورة بنجاح ✓' : 'Photo uploaded ✓')
    } catch (err) {
      console.error('Upload avatar error:', err)
      toast(isAr ? 'فشل الرفع، يرجى المحاولة مجدداً' : 'Upload failed, please try again', 'error')
    }
    setUploading(false)
  }

  const addLink = () => setLinks((l) => [...l, { label: '', url: '', subtitle: '' }])
  const updateLink = (i, k, val) => setLinks((l) => l.map((item, idx) => (idx === i ? { ...item, [k]: val } : item)))
  const delLink = (i) => setLinks((l) => l.filter((_, idx) => idx !== i))

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

  async function loadOrders() {
    setLoadingOrders(true)
    try {
      const o = await listUserOrders(user.uid)
      setOrders(o)
    } catch {}
    setLoadingOrders(false)
  }

  if (loading) {
    return (
      <section className="section">
        <div className="container dash-loading">
          <div className="nfc-loader" />
          <p style={{ color: 'var(--muted)', marginTop: 16 }}>{isAr ? 'جاري تحميل لوحة التحكم…' : 'Loading your profile…'}</p>
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

  const shortUrl = `https://lamsa.ink/${form.username || user.uid}`
  const directPath = `/${form.username || user.uid}`
  const linkCount = links.length
  const socialCount = Object.values(social).filter(Boolean).length
  const hasProfile = !!(form.name && form.role)

  const tabs = [
    { id: 'profile', icon: <IconUser />, label: isAr ? 'البروفايل' : 'Profile' },
    { id: 'themes', icon: <span style={{ fontSize: '1.1rem' }}>🎨</span>, label: isAr ? 'الثيمات' : 'Themes' },
    { id: 'social', icon: <IconLink />, label: isAr ? 'سوشيال' : 'Social', badge: socialCount || null },
    { id: 'links', icon: <IconZap />, label: isAr ? 'الروابط' : 'Links', badge: linkCount || null },
    { id: 'leads', icon: <span style={{ fontSize: '1.1rem' }}>👥</span>, label: isAr ? 'جهات الاتصال' : 'Contacts', badge: leads.length || null },
    { id: 'analytics', icon: <span style={{ fontSize: '1.1rem' }}>📊</span>, label: isAr ? 'التحليلات' : 'Analytics' },
    { id: 'orders', icon: <IconCreditCard />, label: isAr ? 'طلباتي' : 'Orders' },
    { id: 'nfc', icon: <NfcIcon />, label: isAr ? 'بطاقة NFC' : 'NFC Card' },
  ]

  return (
    <section className="section dash-section">
      <div className="container">
        {/* Activation Banner */}
        {!activated && (
          <div className="dash-alert-banner" style={{ marginBottom: 20, borderLeft: '4px solid #f59e0b', background: 'rgba(245, 158, 11, 0.08)' }}>
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

        {/* Custom Short Link Hero Bar */}
        <div className="dash-shortlink-card">
          <div className="dsl-info">
            <span className="dsl-badge">⚡ {isAr ? 'رابط بطاقتك الذكية المختصر (Link-in-Bio)' : 'Your Short NFC Link'}</span>
            <div className="dsl-url-row">
              <b className="dsl-url-text">https://lamsa.ink/<span style={{ color: 'var(--cobalt)' }}>{form.username || user.uid}</span></b>
            </div>
          </div>
          <div className="dsl-buttons">
            <button className="btn btn-primary btn-sm" onClick={() => {
              navigator.clipboard.writeText(shortUrl)
              toast(isAr ? 'تم نسخ الرابط المختصر ✓' : 'Short link copied ✓')
            }}>
              📋 {isAr ? 'نسخ الرابط' : 'Copy'}
            </button>
            <a href={directPath} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
              👁️ {isAr ? 'معاينة' : 'Preview'}
            </a>
          </div>
        </div>

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
              navigator.clipboard.writeText(shortUrl)
              toast(isAr ? 'اتنسخ الرابط المختصر ✓' : 'Link copied ✓')
            }}>
              <IconCheck /> {isAr ? 'نسخ الرابط' : 'Copy link'}
            </button>
            <a href={directPath} target="_blank" rel="noreferrer" className="btn btn-ghost">
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
          <div className={`dash-stat ${leads.length > 0 ? 'active' : ''}`}>
            <div className="ds-icon"><span style={{ fontSize: '1.2rem' }}>👥</span></div>
            <div><b>{leads.length}</b><span>{isAr ? 'جهات الاتصال' : 'Contacts'}</span></div>
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
                
                {/* Custom Username Field */}
                <div className="field" style={{ marginBottom: 18 }}>
                  <label>{isAr ? 'اسم الرابط المختصر (Username)' : 'Custom Short URL (Username)'} *</label>
                  <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface, rgba(0,0,0,0.03))', border: '2px solid var(--line)', borderRadius: 14, padding: '4px 14px' }}>
                    <span style={{ fontWeight: 800, color: 'var(--muted)', fontSize: '0.95rem', userSelect: 'none' }}>lamsa.ink/</span>
                    <input
                      value={form.username || ''}
                      onChange={(e) => setForm((f) => ({ ...f, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                      placeholder="yourname"
                      dir="ltr"
                      style={{ border: 'none', background: 'transparent', outline: 'none', fontWeight: 800, fontSize: '1rem', width: '100%', color: 'var(--cobalt)' }}
                    />
                  </div>
                  <small style={{ color: 'var(--muted)', marginTop: 4, display: 'block' }}>
                    {isAr ? 'هذا هو الرابط الذكي القصير الذي يفتح بطاقتك فوراً' : 'This is your direct clean link that opens your NFC card'}
                  </small>
                </div>

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

            {tab === 'leads' && (
              <LeadsTab leads={leads} isAr={isAr} onRefresh={loadLeadsData} />
            )}

            {tab === 'analytics' && (
              <AnalyticsTab analytics={analytics} links={links} isAr={isAr} onRefresh={loadAnalyticsData} />
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
                    <span className="nfc-link-url">{shortUrl}</span>
                  </div>
                  <button className="btn btn-primary" onClick={() => { navigator.clipboard.writeText(shortUrl); toast(isAr ? 'تم النسخ ✓' : 'Copied ✓') }}>
                    <IconCheck /> {isAr ? 'نسخ' : 'Copy'}
                  </button>
                </div>
                <div style={{ height: 18 }} />
                <div className="nfc-qr-section">
                  <div className="nfc-qr">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(shortUrl)}&format=svg&color=0c1830`}
                      alt="QR Code"
                      style={{ borderRadius: 12, width: '100%', height: 'auto' }}
                    />
                  </div>
                  <div className="nfc-qr-info">
                    <h4>{isAr ? 'كود الـ QR' : 'QR Code'}</h4>
                    <p>{isAr ? 'امسح الكود بكاميرا الموبايل بتاعك عشان تفتح صفحتك.' : 'Scan with your phone camera to open your page.'}</p>
                    <a className="btn btn-ghost btn-sm" href={directPath} target="_blank" rel="noreferrer"><IconRefresh /> {isAr ? 'افتح الصفحة' : 'Open page'}</a>
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
                          } catch {}
                        }}
                      >
                        <div className="theme-card-preview" style={{ background: t.preview }}>
                          <span className="theme-accent-dot" style={{ background: t.accent }} />
                          {isSelected && <span className="theme-active-badge">✓</span>}
                        </div>
                        <div className="theme-card-info">
                          <b>{isAr ? t.nameAr : t.nameEn}</b>
                          <small>{isAr ? t.descAr : t.descEn}</small>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Mobile Live Mockup */}
          <div className="dash-sidebar">
            <div className={`preview-phone theme-${form.theme || 'default'}`}>
              <div className="preview-notch">
                <div className="dpn-speaker" />
                <div className="dpn-cam" />
              </div>
              <div className="preview-screen">
                <div className="preview-cover" />
                <div className="preview-avatar">
                  {form.avatar ? <img src={form.avatar} alt="" /> : <span>{(form.name || 'U').charAt(0).toUpperCase()}</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, margin: '8px 0 2px' }}>
                  <div className="preview-name" style={{ margin: 0 }}>{form.name || (isAr ? 'اسمك هنا' : 'Your Name')}</div>
                  <IconVerified size="1.1em" />
                </div>
                {form.role && <div className="preview-role">{form.role}</div>}
                {form.bio && <div className="preview-bio">{form.bio}</div>}

                <div className="preview-socials" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', margin: '10px 0' }}>
                  {social.whatsapp && <span className="ps-icon" style={{ background: '#25D366', color: '#fff' }}><IconWhatsApp /></span>}
                  {social.instagram && <span className="ps-icon" style={{ background: '#E4405F', color: '#fff' }}><IconInstagram /></span>}
                  {social.linkedin && <span className="ps-icon" style={{ background: '#0A66C2', color: '#fff' }}><IconLinkedin /></span>}
                  {social.youtube && <span className="ps-icon" style={{ background: '#FF0000', color: '#fff' }}><IconYouTube /></span>}
                  {social.facebook && <span className="ps-icon" style={{ background: '#1877F2', color: '#fff' }}><IconFacebook /></span>}
                  {social.tiktok && <span className="ps-icon" style={{ background: '#000000', color: '#fff' }}><IconTikTok /></span>}
                  {social.telegram && <span className="ps-icon" style={{ background: '#229ED9', color: '#fff' }}><IconTelegram /></span>}
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
                          padding: '8px 12px',
                          borderRadius: 12,
                          background: 'rgba(255,255,255,0.08)',
                          border: '1px solid rgba(255,255,255,0.14)',
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
                            <div style={{ fontWeight: 800, fontSize: '0.8rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', color: '#fff' }}>
                              {l.label || l.url}
                            </div>
                            {l.subtitle && (
                              <div style={{ fontSize: '0.68rem', opacity: 0.7, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', color: '#cbd5e1' }}>
                                {l.subtitle}
                              </div>
                            )}
                          </div>
                          <span style={{ opacity: 0.7, fontSize: '0.75rem', color: '#fff' }}>{isAr ? '←' : '→'}</span>
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

                <div style={{ textAlign: 'center', marginTop: 'auto', paddingTop: 14, fontSize: '0.66rem', color: '#94a3b8' }}>
                  ⚡️ {isAr ? 'مدعوم بتقنية لمسة NFC' : 'Powered by Lamsa NFC'}
                </div>
              </div>
            </div>
            <a href={directPath} target="_blank" rel="noreferrer" className="preview-open">
              👁️ {isAr ? 'معاينة البطاقة في صفحة كاملة' : 'Open full card preview'}
            </a>
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

function AnalyticsTab({ analytics, links, isAr, onRefresh }) {
  const views = analytics?.totalViews || 0
  const clicks = analytics?.totalClicks || 0
  const ctr = views > 0 ? Math.min(100, Math.round((clicks / views) * 100)) : 0
  const breakdown = analytics?.clicksBreakdown || {}

  return (
    <div className="dash-card">
      <div className="dash-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3>{isAr ? 'تحليلات ونقرات بطاقتك 📊' : 'Analytics & Tap Insights 📊'}</h3>
          <p>{isAr ? 'تابع عدد المشاهدات، والنقرات، ومعدل التفاعل مع روابطك الذكية.' : 'Track profile views, link clicks and audience engagement.'}</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onRefresh}>🔄 {isAr ? 'تحديث' : 'Refresh'}</button>
      </div>

      {/* KPI Cards */}
      <div className="analytics-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
        <div className="ak-card" style={{ background: 'rgba(24, 84, 232, 0.06)', border: '1.5px solid rgba(24, 84, 232, 0.2)', padding: 18, borderRadius: 18 }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 800 }}>{isAr ? 'إجمالي المشاهدات' : 'Profile Views'}</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--cobalt)', margin: '4px 0' }}>{views.toLocaleString()}</div>
          <small style={{ color: '#16a34a', fontWeight: 700 }}>{isAr ? 'مباشر من الهواتف والـ NFC' : 'Live from NFC & web'}</small>
        </div>

        <div className="ak-card" style={{ background: 'rgba(16, 185, 129, 0.06)', border: '1.5px solid rgba(16, 185, 129, 0.2)', padding: 18, borderRadius: 18 }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 800 }}>{isAr ? 'إجمالي النقرات' : 'Total Clicks'}</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#10b981', margin: '4px 0' }}>{clicks.toLocaleString()}</div>
          <small style={{ color: '#16a34a', fontWeight: 700 }}>{isAr ? 'تفاعل مع الروابط والسوشيال' : 'Links & socials'}</small>
        </div>

        <div className="ak-card" style={{ background: 'rgba(245, 158, 11, 0.06)', border: '1.5px solid rgba(245, 158, 11, 0.2)', padding: 18, borderRadius: 18 }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 800 }}>{isAr ? 'معدل التفاعل (CTR)' : 'Engagement Rate'}</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#f59e0b', margin: '4px 0' }}>{ctr}%</div>
          <small style={{ color: '#f59e0b', fontWeight: 700 }}>{isAr ? 'نسبة نقر الزوار للروابط' : 'Click through rate'}</small>
        </div>
      </div>

      {/* Clicks Breakdown */}
      <div>
        <h4 style={{ margin: '0 0 14px', fontSize: '1.05rem' }}>{isAr ? 'الروابط الأكثر تفاعلاً وزيارة 🚀' : 'Most Clicked Links 🚀'}</h4>
        {Object.keys(breakdown).length === 0 ? (
          <div className="empty-state" style={{ padding: '24px 10px' }}>
            <p>{isAr ? 'شارك بطاقتك لبدء تسجيل النقرات والتحليلات الحية.' : 'Share your card to start tracking real-time clicks.'}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Object.entries(breakdown).sort(([, a], [, b]) => b - a).map(([name, count], idx) => {
              const maxCount = Math.max(...Object.values(breakdown), 1)
              const pct = Math.round((count / maxCount) * 100)
              return (
                <div key={idx} style={{ background: 'var(--surface, rgba(0,0,0,0.02))', border: '1px solid var(--line)', borderRadius: 14, padding: '10px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <b style={{ fontSize: '0.9rem' }}>{name}</b>
                    <span style={{ fontWeight: 800, color: 'var(--cobalt)', fontSize: '0.92rem' }}>{count} {isAr ? 'نقرة' : 'clicks'}</span>
                  </div>
                  <div style={{ width: '100%', height: 6, background: 'var(--line)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, var(--cobalt), #06b6d4)', borderRadius: 99 }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function LeadsTab({ leads, isAr, onRefresh }) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search) return leads
    const q = search.toLowerCase()
    return leads.filter((l) => (l.name || '').toLowerCase().includes(q) || (l.phone || '').includes(q) || (l.email || '').toLowerCase().includes(q))
  }, [leads, search])

  function exportCSV() {
    if (leads.length === 0) return alert(isAr ? 'لا توجد جهات اتصال للتصدير' : 'No contacts to export')
    const headers = ['Name', 'Phone', 'Email', 'Note', 'Date']
    const rows = leads.map((l) => [
      `"${l.name || ''}"`,
      `"${l.phone || ''}"`,
      `"${l.email || ''}"`,
      `"${(l.note || '').replace(/"/g, '""')}"`,
      `"${l.createdAt ? new Date(l.createdAt).toLocaleDateString() : ''}"`
    ])
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lamsa_contacts_${Date.now()}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="dash-card">
      <div className="dash-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h3>{isAr ? 'جهات الاتصال المستلمة (Leads) 👥' : 'Received Contacts (Leads) 👥'}</h3>
          <p>{isAr ? 'بيانات الأشخاص الذين قاموا بإرسال معلوماتهم إليك من بطاقتك الذكية.' : 'Contacts received when visitors exchanged details with your card.'}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary btn-sm" onClick={exportCSV}>
            📥 {isAr ? 'تصدير إكسل (CSV)' : 'Export CSV'}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={onRefresh}>
            🔄
          </button>
        </div>
      </div>

      {leads.length > 0 && (
        <div className="dash-search" style={{ marginBottom: 16 }}>
          <input
            type="text"
            placeholder={isAr ? 'بحث بالاسم، رقم الهاتف، الإيميل…' : 'Search by name, phone, email…'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1.5px solid var(--line)', background: 'var(--card)' }}
          />
        </div>
      )}

      {leads.length === 0 ? (
        <div className="empty-state" style={{ padding: '40px 10px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🤝</div>
          <h4>{isAr ? 'لسه مفيش جهات اتصال مستلمة' : 'No contacts received yet'}</h4>
          <p style={{ maxWidth: 420, margin: '0 auto', fontSize: '0.88rem' }}>
            {isAr ? 'عندما يفتح أي شخص بطاقتك الذكية ويضغط على "أرسل بياناتك"، ستظهر معلوماته هنا فوراً.' : 'When someone taps "Connect / Send Info" on your card, their details will appear here.'}
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <p>{isAr ? 'لا توجد نتائج تطابق بحثك' : 'No results matching your search'}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {filtered.map((l, idx) => {
            let phone = l.phone ? l.phone.replace(/[^0-9]/g, '') : ''
            if (phone.startsWith('01')) phone = '2' + phone
            const waUrl = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(`مرحباً ${l.name || ''} 👋، تشرفت بالتواصل معك عبر بطاقتي الذكية على منصة لمسة...`)}` : ''

            return (
              <div key={idx} style={{ background: 'var(--surface, rgba(0,0,0,0.02))', border: '1.5px solid var(--line)', borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <b style={{ fontSize: '1rem', color: 'var(--text)' }}>{l.name}</b>
                    <small style={{ color: 'var(--muted)', fontSize: '0.74rem' }}>{l.createdAt ? new Date(l.createdAt).toLocaleDateString() : ''}</small>
                  </div>

                  <div style={{ margin: '10px 0', display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.86rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text)' }}>
                      <IconPhone size="0.95em" />
                      <span>{l.phone}</span>
                    </div>
                    {l.email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)', fontSize: '0.82rem' }}>
                        <IconMail size="0.95em" />
                        <span>{l.email}</span>
                      </div>
                    )}
                  </div>

                  {l.note && (
                    <div style={{ background: 'rgba(0,0,0,0.04)', padding: '6px 10px', borderRadius: 8, fontSize: '0.8rem', color: 'var(--muted)', margin: '8px 0 14px' }}>
                      "{l.note}"
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  {waUrl && (
                    <a href={waUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ flex: 1, color: '#16a34a', fontWeight: 800, textAlign: 'center' }}>
                      💬 واتساب
                    </a>
                  )}
                  {l.phone && (
                    <a href={`tel:${l.phone}`} className="btn btn-ghost btn-sm" style={{ color: 'var(--cobalt)', fontWeight: 800 }}>
                      📞 اتصال
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
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
