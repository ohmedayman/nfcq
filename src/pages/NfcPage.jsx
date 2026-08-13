import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLang } from '../context/LanguageContext'
import { CARD_THEMES, generateVCardDataUri } from '../lib/utils'
import { toast } from '../components/Toast'
import Logo from '../components/Logo'
import {
  NfcIcon, IconInstagram, IconLinkedin, IconTwitter, IconWhatsApp,
  IconMail, IconPhone, IconPin, IconZap, IconCheck, IconVerified, IconGlobe, IconRefresh
} from '../components/icons'

export default function NfcPage() {
  const { lang } = useLang()
  const isAr = lang === 'ar'
  const nav = useNavigate()

  // Live Playground State
  const [tapped, setTapped] = useState(false)
  const [rippling, setRippling] = useState(false)
  const [activeTheme, setActiveTheme] = useState('midnight-gold')
  const [profile, setProfile] = useState({
    name: isAr ? 'د. محمد أيمن' : 'Dr. Mohamed Ayman',
    role: isAr ? 'استشاري ورائد أعمال' : 'Consultant & Entrepreneur',
    bio: isAr ? 'مؤسس منصات رقمية واستشاري أعمال. أشارك خبراتي في تطوير المشاريع والتكنولوجيا 🚀' : 'Digital Entrepreneur & Business Consultant. Sharing insights on smart technology.',
    phone: '01028707543',
    email: 'mohamed@lamsa.ink',
    city: isAr ? 'القاهرة، مصر' : 'Cairo, Egypt',
    avatar: '👨‍💼',
    whatsapp: '201028707543',
    instagram: 'lamsa.ink',
    linkedin: 'mohamed-ayman',
    website: 'https://lamsa.ink',
  })

  const [activeTab, setActiveTab] = useState('profile') // 'profile' | 'links' | 'themes' | 'qr'
  const [qrModal, setQrModal] = useState(false)

  const links = [
    { label: isAr ? 'حجز موعد أو استشارة فورية 📅' : 'Book a Consultation 📅', sub: isAr ? 'مواعيد العمل المتاحة' : 'Available slots', icon: 'zap', color: '#1854e8' },
    { label: isAr ? 'كتالوج الأعمال والمشاريع 💼' : 'Portfolio & Projects 💼', sub: isAr ? 'شاهد أحدث الإنجازات' : 'View recent work', icon: 'zap', color: '#06b6d4' },
    { label: isAr ? 'تواصل معي مباشرة عبر واتساب 💬' : 'Direct WhatsApp Chat 💬', sub: isAr ? 'رد فوري خلال دقائق' : 'Instant response', icon: 'whatsapp', color: '#25D366' },
  ]

  function handleTap() {
    setRippling(true)
    setTimeout(() => {
      setTapped(true)
      setRippling(false)
      toast(isAr ? '⚡️ تم قراءة شريحة الـ NFC وفتح البروفايل بنجاح!' : '⚡️ NFC Chip read & Profile opened successfully!')
    }, 600)
  }

  function handleDownloadVCard() {
    try {
      const uri = generateVCardDataUri(profile)
      const a = document.createElement('a')
      a.href = uri
      a.download = `${profile.name.replace(/\s+/g, '_')}_contact.vcf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      toast(isAr ? 'تم تحميل جهة الاتصال (.vcf) لحفظها في الهاتف ✓' : 'Contact (.vcf) downloaded to save in phone ✓')
    } catch {
      toast(isAr ? 'جاري تجهيز الملف' : 'Preparing file')
    }
  }

  return (
    <div className="demo-studio-page">
      {/* Top Header */}
      <header className="demo-studio-header">
        <div className="container dsh-inner">
          <Link to="/" className="dsh-logo">
            <Logo markSize={38} light={false} />
          </Link>
          <div className="dsh-pill">
            <span className="dsh-pulse" />
            <b>{isAr ? '🎮 استوديو المحاكاة التفاعلي للعميل' : '🎮 Interactive Live Customer Demo'}</b>
          </div>
          <Link to="/store" className="btn btn-primary btn-sm">
            🛒 {isAr ? 'اطلب بطاقتك (-50%)' : 'Get Your Card (-50%)'}
          </Link>
        </div>
      </header>

      {/* Main Studio Grid */}
      <main className="container demo-studio-grid">
        {/* Left Side: Interactive Controls & Customizer Playground */}
        <div className="demo-controls-panel">
          <div className="dcp-card">
            <div className="dcp-head">
              <h2>{isAr ? 'جرب صفحتك بنفسك في ثوانٍ ⚡️' : 'Test your live profile now ⚡️'}</h2>
              <p>{isAr ? 'اكتب بياناتك، غيّر الثيم، واضغط على بطاقة الـ NFC لتجربة سرعة الاتصال بهاتفك' : 'Type your info, switch themes, and tap the NFC card to simulate instant sharing'}</p>
            </div>

            {/* Tap Simulation Trigger */}
            <div className="dcp-tap-trigger-box" onClick={handleTap}>
              <div className={`dtt-card-icon ${rippling ? 'pulsing' : ''}`}>
                <NfcIcon size={32} />
              </div>
              <div className="dtt-text">
                <b>{isAr ? 'انقر هنا لتجربة لمس بطاقة الـ NFC 💳' : 'Click to simulate 1-tap NFC sharing 💳'}</b>
                <small>{isAr ? (tapped ? '✅ متصل ومفعل! انقر لإعادة التجربة' : 'اضغط لتشهد سرعة فتح البروفايل على الهاتف') : (tapped ? '✅ Connected! Click to replay' : 'Tap to trigger the live beam')}</small>
              </div>
              <span className="dtt-badge">{tapped ? '✓ نشط' : '👆 جرب الآن'}</span>
            </div>

            {/* Control Tabs */}
            <div className="dcp-tabs">
              <button className={`dcp-tab-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
                👤 {isAr ? 'البيانات الشخصية' : 'Profile'}
              </button>
              <button className={`dcp-tab-btn ${activeTab === 'themes' ? 'active' : ''}`} onClick={() => setActiveTab('themes')}>
                🎨 {isAr ? 'الثيمات الملكية' : 'Themes'}
              </button>
              <button className={`dcp-tab-btn ${activeTab === 'links' ? 'active' : ''}`} onClick={() => setActiveTab('links')}>
                🔗 {isAr ? 'الروابط والأزرار' : 'Links'}
              </button>
            </div>

            {/* Tab 1: Profile Form */}
            {activeTab === 'profile' && (
              <div className="dcp-form-body">
                <div className="field">
                  <label>{isAr ? 'اسمك أو اسم براندك:' : 'Full Name / Brand:'}</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    placeholder={isAr ? 'مثال: د. محمد أيمن' : 'e.g. Dr. Mohamed Ayman'}
                  />
                </div>

                <div className="field">
                  <label>{isAr ? 'المسمى الوظيفي أو النشاط:' : 'Job Title / Field:'}</label>
                  <input
                    type="text"
                    value={profile.role}
                    onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                    placeholder={isAr ? 'مثال: استشاري جراحة / مصمم واجهات' : 'e.g. Senior Surgeon / Designer'}
                  />
                </div>

                <div className="field">
                  <label>{isAr ? 'النبذة التعريفية (Bio):' : 'Bio description:'}</label>
                  <textarea
                    rows={2}
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    placeholder={isAr ? 'نبذة سريعة عنك وعن أعمالك...' : 'Short bio about what you do...'}
                  />
                </div>

                <div className="dcp-grid-2">
                  <div className="field">
                    <label>{isAr ? 'رقم الواتساب:' : 'WhatsApp Number:'}</label>
                    <input
                      type="text"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value, whatsapp: e.target.value })}
                      placeholder="01028707543"
                    />
                  </div>
                  <div className="field">
                    <label>{isAr ? 'البريد الإلكتروني:' : 'Email Address:'}</label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      placeholder="info@yourdomain.com"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Theme Selector */}
            {activeTab === 'themes' && (
              <div className="dcp-themes-body">
                <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 12 }}>
                  {isAr ? 'اختر الطابع اللوني الذي يمثلك ويعكس فخامة هويتك البصرية:' : 'Choose a luxury aesthetic palette for your profile:'}
                </p>
                <div className="dcp-theme-grid">
                  {CARD_THEMES.map((t) => (
                    <button
                      key={t.id}
                      className={`dcp-theme-card ${activeTheme === t.id ? 'active' : ''}`}
                      onClick={() => setActiveTheme(t.id)}
                    >
                      <div className="dtc-preview" style={{ background: t.bg }}>
                        <span className="dtc-dot" style={{ background: t.accent }} />
                      </div>
                      <b>{isAr ? t.nameAr : t.name}</b>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 3: Interactive Links */}
            {activeTab === 'links' && (
              <div className="dcp-links-body">
                <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 12 }}>
                  {isAr ? 'تأتي صفحتك مجهزة بأزرار ذكية قابلة للتخصيص الكامل بنقرة واحدة:' : 'Your profile comes with actionable dynamic smart links:'}
                </p>
                <div className="dcp-links-preview-list">
                  {links.map((l, idx) => (
                    <div key={idx} className="dcp-link-item">
                      <div className="dli-icon" style={{ background: l.color }}><IconZap /></div>
                      <div className="dli-text">
                        <b>{l.label}</b>
                        <small>{l.sub}</small>
                      </div>
                      <span className="dli-badge">✓ {isAr ? 'مفعل' : 'Active'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions Bar */}
            <div className="dcp-bottom-actions">
              <button className="btn btn-ghost" onClick={() => setQrModal(!qrModal)}>
                📲 {isAr ? 'عرض QR كود للهاتف' : 'Show Phone QR'}
              </button>
              <button className="btn btn-primary" onClick={() => nav('/store')}>
                🛒 {isAr ? 'اطلب بطاقتك المطبوعة الآن' : 'Order Your Physical Card'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Live Realistic Smartphone Simulator */}
        <div className="demo-phone-display">
          {/* iOS Dynamic Notification when tapped */}
          <div className={`demo-ios-toast ${tapped ? 'visible' : ''}`}>
            <div className="dit-icon"><NfcIcon size={18} /></div>
            <div className="dit-text">
              <b>{isAr ? 'تم قراءة بطاقة Lamsa NFC الذكية ⚡️' : 'Lamsa Smart NFC Card Detected ⚡️'}</b>
              <span>{isAr ? 'انقر لفتح جهة الاتصال والروابط الرسمية' : 'Tap to open verified link-in-bio'}</span>
            </div>
          </div>

          {/* Smartphone Hardware Casing */}
          <div className={`demo-phone-casing theme-${activeTheme}`}>
            <div className="demo-phone-notch">
              <div className="dpn-speaker" />
              <div className="dpn-cam" />
            </div>

            {/* Screen Content */}
            <div className="demo-phone-screen">
              <div className="dps-cover-hero">
                <div className="dps-shimmer-wave" />
              </div>

              <div className="dps-avatar-box">
                <span className="dps-avatar-txt">{profile.avatar || profile.name.charAt(0)}</span>
              </div>

              <div className="dps-info">
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, margin: '0 auto 2px' }}>
                  <h3 className="dps-name" style={{ margin: 0 }}>{profile.name}</h3>
                  <IconVerified size="1.15em" />
                </div>
                <div className="dps-role">{profile.role}</div>
                <p className="dps-bio">{profile.bio}</p>
              </div>

              {/* Social Bar */}
              <div className="dps-socials">
                {profile.whatsapp && (
                  <a href={`https://wa.me/${profile.whatsapp}`} target="_blank" rel="noreferrer" className="dps-soc-btn" style={{ background: '#25D366' }}>
                    <IconWhatsApp />
                  </a>
                )}
                <a href={`https://instagram.com/${profile.instagram}`} target="_blank" rel="noreferrer" className="dps-soc-btn" style={{ background: '#E4405F' }}>
                  <IconInstagram />
                </a>
                <a href={`https://linkedin.com/in/${profile.linkedin}`} target="_blank" rel="noreferrer" className="dps-soc-btn" style={{ background: '#0A66C2' }}>
                  <IconLinkedin />
                </a>
                <a href={`mailto:${profile.email}`} className="dps-soc-btn" style={{ background: '#1854e8' }}>
                  <IconMail />
                </a>
              </div>

              {/* Action Buttons List */}
              <div className="dps-links-list">
                {links.map((l, i) => (
                  <div key={i} className="dps-link-btn">
                    <span className="dps-lb-icon" style={{ background: l.color }}><IconZap /></span>
                    <div className="dps-lb-txt">
                      <b>{l.label}</b>
                      <small>{l.sub}</small>
                    </div>
                    <span className="dps-lb-arrow">{isAr ? '←' : '→'}</span>
                  </div>
                ))}
              </div>

              {/* 1-Click Save Contact Button */}
              <button className="dps-vcard-btn" onClick={handleDownloadVCard}>
                💾 {isAr ? 'حفظ جهة الاتصال في الهاتف (.vcf)' : 'Save Contact to Phone (.vcf)'}
              </button>

              <div className="dps-footer">
                <span>⚡️ {isAr ? 'مدعوم بتقنية لمسة NFC الذكية' : 'Powered by Lamsa Smart NFC'}</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* QR Code Modal for Live Phone Test */}
      {qrModal && (
        <div className="adm-modal-overlay" style={{ zIndex: 99999, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.75)' }} onClick={() => setQrModal(false)}>
          <div className="adm-modal" style={{ maxWidth: 380, textAlign: 'center', borderRadius: 24, padding: 28 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 8px' }}>📲 {isAr ? 'امسح الرمز بكاميرا هاتفك' : 'Scan With Your Phone'}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 20 }}>
              {isAr ? 'افتح كاميرا الآيفون أو الأندرويد وامسح الرمز لتجرب صفحتك على شاشة هاتفك مباشرة' : 'Point your phone camera to test this live profile on your phone'}
            </p>
            <div style={{ background: '#ffffff', padding: 14, borderRadius: 16, display: 'inline-block', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://lamsa.ink&color=0f172a&bgcolor=ffffff`}
                alt="QR Code"
                style={{ width: 180, height: 180, display: 'block' }}
              />
            </div>
            <div style={{ marginTop: 20 }}>
              <button className="btn btn-primary btn-block" onClick={() => setQrModal(false)}>
                {isAr ? 'إغلاق المعاينة' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
