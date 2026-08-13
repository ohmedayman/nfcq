import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { useLang } from '../context/LanguageContext'
import { CURRENCY } from '../data/content'
import { useProducts } from '../context/ProductContext'
import Reveal from '../components/Reveal'
import {
  NfcIcon, IconUser, IconRefresh, IconShield, IconZap, IconCheck, IconPhone,
  IconYouTube, IconFacebook, IconTikTok, IconTelegram, IconWhatsApp, IconInstagram,
  IconLinkedin, IconTwitter, PlatformIcon, IconVerified, IconShare,
} from '../components/icons'
import StandardCard from '../components/StandardCard'
import PremiumCard from '../components/PremiumCard'

function useCountUp(target, duration = 1800) {
  const [val, setVal] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true
        const start = performance.now()
        const tick = (now) => {
          const p = Math.min((now - start) / duration, 1)
          const ease = 1 - Math.pow(1 - p, 3)
          setVal(Math.round(ease * target))
          if (p < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }
    }, { threshold: 0.3 })
    io.observe(el)
    return () => io.disconnect()
  }, [target, duration])
  return { ref, val }
}

function StatCounter({ value, suffix = '', label }) {
  const { ref, val } = useCountUp(value)
  return (
    <div className="stat" ref={ref}>
      <b>{val.toLocaleString()}{suffix}</b>
      <span>{label}</span>
    </div>
  )
}

const CREATOR_CARDS = [
  {
    name: 'Dr. Mohamed Ayman',
    handle: 'dr_mohamed',
    role: 'منصة تعليمية وطبيب',
    theme: 'midnight-gold',
    avatar: '👨‍⚕️',
    gradient: 'linear-gradient(135deg, #1e1b4b, #d97706)',
    tag: 'تعليم وصحة',
  },
  {
    name: 'Milano Store',
    handle: 'milano_eg',
    role: 'علامة أزياء وتجارة إلكترونية',
    theme: 'cyber-neon',
    avatar: '🛍️',
    gradient: 'linear-gradient(135deg, #0f172a, #06b6d4)',
    tag: 'تجارة ومتاجر',
  },
  {
    name: 'Sarah Design Studio',
    handle: 'sarah_ux',
    role: 'مصممة واجهات وتجارب مستخدم',
    theme: 'rose-gold',
    avatar: '🎨',
    gradient: 'linear-gradient(135deg, #881337, #f43f5e)',
    tag: 'تصميم وإبداع',
  },
  {
    name: 'Karim Tech',
    handle: 'karim_dev',
    role: 'مؤسس شركة برمجيات',
    theme: 'emerald-vip',
    avatar: '💻',
    gradient: 'linear-gradient(135deg, #064e3b, #10b981)',
    tag: 'تكنولوجيا وريادة',
  },
]

export default function Home() {
  const { text, lang } = useLang()
  const { products } = useProducts()
  const isAr = lang === 'ar'
  const nav = useNavigate()

  const [claimName, setClaimName] = useState('')
  const [activeTheme, setActiveTheme] = useState('midnight-gold')
  const [faqOpen, setFaqOpen] = useState(null)

  function handleClaimSubmit(e) {
    e.preventDefault()
    const clean = claimName.trim().replace(/^@/, '')
    if (clean) {
      nav(`/account?mode=register&username=${encodeURIComponent(clean)}&redirect=/store`)
    } else {
      nav(`/account?mode=register&redirect=/store`)
    }
  }

  return (
    <div className="home-wrapper">
      {/* HERO SECTION WITH LINKTREE CLAIM BAR */}
      <section className="lt-hero">
        <div className="lt-hero-bg" />
        <div className="container lt-hero-grid">
          <div className="lt-hero-content">
            <Reveal>
              <div className="lt-pill-badge">
                <span className="lt-pulse-dot" />
                <span>{isAr ? '✨ الجيل القادم من بطاقات الأعمال والروابط الذكية' : '✨ Next-Gen Link-in-Bio & NFC Card'}</span>
              </div>
            </Reveal>

            <Reveal delay={80}>
              <h1 className="lt-hero-title">
                {isAr ? (
                  <>كل ما تصنعه وتشاركه، في <span className="lt-text-gradient">رابط ولمسة واحدة ذكية</span></>
                ) : (
                  <>Everything you are, in <span className="lt-text-gradient">one simple link & smart tap</span></>
                )}
              </h1>
            </Reveal>

            <Reveal delay={140}>
              <p className="lt-hero-subtitle">
                {isAr
                  ? 'انضم لأكثر من 15,000 صانع محتوى، طبيب، ومؤسس شركة. صفحة رقمية مخصصة بالكامل وبطاقة NFC تفتح بلمسة هاتفك بدون أي تطبيقات!'
                  : 'Join 15,000+ creators, professionals and brands. A fully customized digital profile and NFC smart card ready in seconds.'}
              </p>
            </Reveal>

            {/* Claim Username Input Form */}
            <Reveal delay={200}>
              <form className="lt-claim-box" onSubmit={handleClaimSubmit}>
                <div className="lt-claim-input-wrap">
                  <span className="lt-claim-prefix">lamsa.ink/</span>
                  <input
                    type="text"
                    className="lt-claim-input"
                    placeholder={isAr ? 'اسمك_أو_براندك' : 'yourname'}
                    value={claimName}
                    onChange={(e) => setClaimName(e.target.value)}
                    dir="ltr"
                  />
                </div>
                <button type="submit" className="lt-claim-btn">
                  {isAr ? 'احصل على بطاقتك مجاناً 🚀' : 'Claim your link 🚀'}
                </button>
              </form>
            </Reveal>

            <Reveal delay={260}>
              <div className="lt-trust-row">
                <div className="lt-avatars">
                  <span className="lt-av" style={{ background: '#3b82f6' }}>👨‍⚕️</span>
                  <span className="lt-av" style={{ background: '#ec4899' }}>👩‍🎨</span>
                  <span className="lt-av" style={{ background: '#10b981' }}>👨‍💻</span>
                  <span className="lt-av" style={{ background: '#f59e0b' }}>🛍️</span>
                </div>
                <div className="lt-trust-text">
                  <b>{isAr ? 'موثوق من آلاف المشاهير والشركات في مصر والخليج' : 'Trusted by thousands of creators & businesses'}</b>
                  <span>⭐️⭐️⭐️⭐️⭐️ 4.9/5 {isAr ? 'تقييم رضا العملاء' : 'Customer rating'}</span>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Interactive Live Phone Simulator */}
          <div className="lt-hero-visual">
            <Reveal delay={180}>
              <div className={`lt-phone-mockup theme-${activeTheme}`}>
                <div className="lt-phone-notch" />
                <div className="lt-phone-screen">
                  {/* Phone Header */}
                  <div className="lt-screen-cover" />
                  <div className="lt-screen-avatar">
                    <span>👑</span>
                  </div>
                  
                  <div className="lt-screen-name-row">
                    <h3 className="lt-screen-name">{claimName ? claimName : (isAr ? 'Mohamed Ayman' : 'Alex Rivera')}</h3>
                    <IconVerified size="1.15em" />
                  </div>
                  <div className="lt-screen-role">{isAr ? 'صانع محتوى ورائد أعمال' : 'Creator & Entrepreneur'}</div>
                  <div className="lt-screen-bio">{isAr ? 'أشارك تجاربي في البرمجة وتطوير المنصات الرقمية 🚀' : 'Building digital products & sharing growth tools'}</div>

                  {/* Social Row */}
                  <div className="lt-screen-socials">
                    <span className="lt-ss-btn" style={{ background: '#FF0000', color: '#fff' }}><IconYouTube /></span>
                    <span className="lt-ss-btn" style={{ background: '#1877F2', color: '#fff' }}><IconFacebook /></span>
                    <span className="lt-ss-btn" style={{ background: '#000000', color: '#fff' }}><IconTikTok /></span>
                    <span className="lt-ss-btn" style={{ background: '#25D366', color: '#fff' }}><IconWhatsApp /></span>
                    <span className="lt-ss-btn" style={{ background: '#E4405F', color: '#fff' }}><IconInstagram /></span>
                  </div>

                  {/* Links List */}
                  <div className="lt-screen-links">
                    <div className="lt-screen-link-item">
                      <span className="lt-sli-icon" style={{ background: '#FF0000', color: '#fff' }}><IconYouTube /></span>
                      <div className="lt-sli-text">
                        <b>{isAr ? 'قناتي الرسمية على يوتيوب' : 'My YouTube Channel'}</b>
                        <span>2.2M Subscribers</span>
                      </div>
                      <span className="lt-sli-arrow">{isAr ? '←' : '→'}</span>
                    </div>

                    <div className="lt-screen-link-item">
                      <span className="lt-sli-icon" style={{ background: '#25D366', color: '#fff' }}><IconWhatsApp /></span>
                      <div className="lt-sli-text">
                        <b>{isAr ? 'الدعم الفني والواتساب' : 'WhatsApp Support'}</b>
                        <span>{isAr ? 'تواصل فوري ومباشر' : 'Instant Chat'}</span>
                      </div>
                      <span className="lt-sli-arrow">{isAr ? '←' : '→'}</span>
                    </div>

                    <div className="lt-screen-link-item">
                      <span className="lt-sli-icon" style={{ background: '#d97706', color: '#fff' }}><IconZap /></span>
                      <div className="lt-sli-text">
                        <b>{isAr ? 'كتابي ومنصتي التعليمية' : 'Platform & Store'}</b>
                        <span>{isAr ? 'متوفر الشحن الفوري' : 'Available now'}</span>
                      </div>
                      <span className="lt-sli-arrow">{isAr ? '←' : '→'}</span>
                    </div>
                  </div>

                  {/* Save Contact Button */}
                  <button className="lt-screen-vcard-btn">
                    💾 {isAr ? 'حفظ جهة الاتصال في الهاتف' : 'Save Contact'}
                  </button>
                </div>

                {/* Live Theme Switcher Tabs */}
                <div className="lt-theme-switcher-pills">
                  <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--muted)' }}>{isAr ? 'جرّب الثيم:' : 'Theme:'}</span>
                  <button className={`lt-theme-pill ${activeTheme === 'midnight-gold' ? 'active' : ''}`} onClick={() => setActiveTheme('midnight-gold')}>Gold</button>
                  <button className={`lt-theme-pill ${activeTheme === 'cyber-neon' ? 'active' : ''}`} onClick={() => setActiveTheme('cyber-neon')}>Neon</button>
                  <button className={`lt-theme-pill ${activeTheme === 'emerald-vip' ? 'active' : ''}`} onClick={() => setActiveTheme('emerald-vip')}>Emerald</button>
                  <button className={`lt-theme-pill ${activeTheme === 'rose-gold' ? 'active' : ''}`} onClick={() => setActiveTheme('rose-gold')}>Rose</button>
                  <button className={`lt-theme-pill ${activeTheme === 'default' ? 'active' : ''}`} onClick={() => setActiveTheme('default')}>Cobalt</button>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* STATS STRIP */}
      <section className="stats">
        <div className="container stats-grid">
          <StatCounter value={15000} suffix="+" label={isAr ? 'بطاقة صادرة' : 'Cards issued'} />
          <StatCounter value={850000} suffix="+" label={isAr ? 'نقرة ولمسة ذكية' : 'NFC taps & clicks'} />
          <StatCounter value={1} suffix="s" label={isAr ? 'سرعة النقل والفتح' : 'Instant connect'} />
          <StatCounter value={100} suffix="%" label={isAr ? 'بدون أي تطبيقات' : 'Zero app required'} />
        </div>
      </section>

      {/* 3D CREATOR SHOWCASE CAROUSEL */}
      <section className="section" style={{ overflow: 'hidden' }}>
        <div className="container">
          <div className="section-head">
            <span className="kicker">{isAr ? 'انضم للمتميزين' : 'Creator Showcase'}</span>
            <h2>{isAr ? 'البطاقة الذكية المفضلة لدى كبار المشاهير وصناع المحتوى' : 'Trusted by Top Creators & Leaders'}</h2>
            <p>{isAr ? 'مرر على أي بطاقة لتكتشف بروفايلهم ورابطهم الرقمي' : 'Hover over any card to reveal their live link'}</p>
          </div>

          <div className="lt-creators-grid">
            {CREATOR_CARDS.map((c, i) => (
              <Reveal key={i} delay={i * 100}>
                <div className="lt-flip-card">
                  <div className="lt-flip-card-inner">
                    {/* Front */}
                    <div className="lt-flip-front" style={{ background: c.gradient }}>
                      <div className="lt-flip-tag">{c.tag}</div>
                      <div className="lt-flip-avatar">{c.avatar}</div>
                      <div className="lt-flip-info">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          <h4 style={{ margin: 0, color: '#fff' }}>{c.name}</h4>
                          <IconVerified size="1.1em" />
                        </div>
                        <p style={{ margin: '4px 0 0', opacity: 0.85, fontSize: '0.84rem', color: '#fff' }}>{c.role}</p>
                      </div>
                    </div>
                    {/* Back */}
                    <div className="lt-flip-back">
                      <div className="lt-flip-back-content">
                        <NfcIcon size="2rem" />
                        <b>lamsa.ink/{c.handle}</b>
                        <p style={{ fontSize: '0.8rem', color: 'var(--muted)', margin: '6px 0 14px' }}>
                          {isAr ? 'مفعل ومربوط ببطاقة NFC ذكية' : 'Active & connected via NFC'}
                        </p>
                        <Link to="/account?mode=register" className="btn btn-primary btn-sm">
                          {isAr ? 'احجز رابطك مثله' : 'Claim your link'}
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 4 VIBRANT VALUE BLOCKS */}
      <section className="lt-pillars-section">
        <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: 60 }}>
          {/* Pillar 1 */}
          <div className="lt-pillar-card lt-pillar-green">
            <div className="lt-pillar-text">
              <span className="lt-pillar-kicker">{isAr ? '٠١ / التخصيص والروابط الذكية' : '01 / Smart Custom Links'}</span>
              <h2>{isAr ? 'اربط كل ما تصنعه وتقدمه في مكان واحد' : 'Connect everything you create and sell in one place'}</h2>
              <p>
                {isAr
                  ? 'اجمع قنواتك (YouTube, TikTok, Facebook, Instagram)، متجرك الإلكتروني، رقم واتساب المباشر، ملفاتك وكتبك في صفحة واحدة جذابة تليق بك.'
                  : 'Bring together your socials, storefront, WhatsApp chat, and media into a stunning, responsive bio link.'}
              </p>
              <Link to="/account?mode=register" className="btn btn-primary">
                {isAr ? 'ابدأ مجاناً الآن' : 'Get started for free'}
              </Link>
            </div>
            <div className="lt-pillar-media">
              <div className="lt-feature-badge-grid">
                <div className="lt-fbg-item" style={{ '--bc': '#FF0000' }}><IconYouTube /> YouTube</div>
                <div className="lt-fbg-item" style={{ '--bc': '#25D366' }}><IconWhatsApp /> WhatsApp</div>
                <div className="lt-fbg-item" style={{ '--bc': '#1877F2' }}><IconFacebook /> Facebook</div>
                <div className="lt-fbg-item" style={{ '--bc': '#000000' }}><IconTikTok /> TikTok</div>
                <div className="lt-fbg-item" style={{ '--bc': '#229ED9' }}><IconTelegram /> Telegram</div>
                <div className="lt-fbg-item" style={{ '--bc': '#E4405F' }}><IconInstagram /> Instagram</div>
                <div className="lt-fbg-item" style={{ '--bc': '#0A66C2' }}><IconLinkedin /> LinkedIn</div>
                <div className="lt-fbg-item" style={{ '--bc': '#d97706' }}><IconZap /> Store / Books</div>
              </div>
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="lt-pillar-card lt-pillar-purple">
            <div className="lt-pillar-text">
              <span className="lt-pillar-kicker">{isAr ? '٠٢ / تقنية اللمس الذكي NFC' : '02 / Tap & Connect Anywhere'}</span>
              <h2>{isAr ? 'لمسة واحدة بهاتفك، وبدون أي تطبيقات' : 'One smart tap. Zero apps needed.'}</h2>
              <p>
                {isAr
                  ? 'بمجرد ملامسة بطاقة لمسة الذكية لظهر أي هاتف iPhone أو Android، تفتح صفحتك وبياناتك فوراً في أجزاء من الثانية مع إمكانية حفظ جهة الاتصال مباشرة.'
                  : 'Tap your physical Lamsa NFC card against any smartphone to beam your links, contact card, and profile instantly.'}
              </p>
              <Link to="/store" className="btn btn-primary">
                {isAr ? '🛒 تصفح متجر البطاقات' : '🛒 Shop NFC Cards'}
              </Link>
            </div>
            <div className="lt-pillar-media">
              <div className="lt-card-showcase-box">
                <img src="/img/hero-card.webp" alt="Lamsa NFC Smart Card" style={{ width: '100%', maxWidth: 380, borderRadius: 20, boxShadow: '0 24px 60px rgba(0,0,0,0.3)' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCTS PREVIEW */}
      <section className="section section-alt">
        <div className="container">
          <div className="section-head">
            <span className="kicker">{isAr ? 'المتجر' : 'Store'}</span>
            <h2>{isAr ? 'اختر بطاقتك الذكية الفاخرة' : 'Choose Your Smart Card'}</h2>
            <p>{isAr ? 'خامات معدنية ومطفية وخشبية مطبوعة بجودة عالمية وشحن حتى باب بيتك' : 'Luxury materials delivered to your doorstep'}</p>
          </div>
          <div className="products-grid">
            {products.slice(0, 3).map((p) => (
              <div key={p.id} className="store-card">
                <div className="store-card-img" style={{ background: p.color || 'var(--card)' }}>
                  <img src={`/img/${p.img}`} alt={p.nameEn} loading="lazy" />
                  {p.popular && <span className="store-badge">{isAr ? 'الأكثر مبيعاً' : 'Bestseller'}</span>}
                </div>
                <div className="store-card-body">
                  <h3>{isAr ? p.nameAr : p.nameEn}</h3>
                  <div className="store-price-row">
                    <span className="store-price">{p.price} {isAr ? 'ج.م' : 'EGP'}</span>
                    {p.originalPrice && <span className="store-old-price">{p.originalPrice} {isAr ? 'ج.م' : 'EGP'}</span>}
                  </div>
                  <Link to={`/store/${p.id}`} className="btn btn-primary" style={{ width: '100%', marginTop: 12 }}>
                    {isAr ? 'اطلب وتفعيل الحساب' : 'Order & Activate'}
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <Link to="/store" className="btn btn-ghost">
              {isAr ? 'عرض جميع الخامات والمنتجات في المتجر ←' : 'View all products in Store →'}
            </Link>
          </div>
        </div>
      </section>

      {/* COMPARISON TABLE */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="kicker">{isAr ? 'مقارنة' : 'Comparison'}</span>
            <h2>{isAr ? 'لماذا تتفوق لمسة NFC عن كل الخيارات؟' : 'Why Lamsa beats paper cards?'}</h2>
            <p>{isAr ? 'مقارنة سريعة بين بطاقتك الذكية والبطاقات التقليدية' : 'Compare Lamsa with traditional alternatives'}</p>
          </div>
          <div className="comparison-table">
            <table>
              <thead>
                <tr>
                  <th>{isAr ? 'الميزة' : 'Feature'}</th>
                  <th className="highlight">لمسة Lamsa NFC</th>
                  <th>{isAr ? 'كرت ورقي عادي' : 'Paper card'}</th>
                  <th>{isAr ? 'موقع شخصي تقليدي' : 'Custom site'}</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { f: isAr ? 'فتح بلمسة NFC بدون تطبيقات' : 'NFC tap to open (No app)', v: '✓', p: '✕', s: '✕' },
                  { f: isAr ? 'حفظ جهة الاتصال في الهاتف فوراً' : 'Instant Save Contact (.vcf)', v: '✓', p: '✕', s: '—' },
                  { f: isAr ? 'تعديل البيانات والروابط لحظياً' : 'Live instant editing', v: '✓', p: '✕', s: '✓' },
                  { f: isAr ? 'دعم جميع منصات السوشيال والفيديو' : 'Full social suite & video', v: '✓', p: '✕', s: '✓' },
                  { f: isAr ? 'تحليلات تفاعل ومتابعة الزوار' : 'Visitor analytics', v: '✓', p: '✕', s: '—' },
                  { f: isAr ? 'خامات فاخرة وعمر يدوم للأبد' : 'Lifetime durable materials', v: '✓', p: '✕', s: '—' },
                ].map((r, i) => (
                  <tr key={i}>
                    <td>{r.f}</td>
                    <td className="highlight">{r.v}</td>
                    <td>{r.p}</td>
                    <td>{r.s}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="section section-alt">
        <div className="container" style={{ maxWidth: 800 }}>
          <div className="section-head">
            <span className="kicker">{isAr ? 'الأسئلة الشائعة' : 'FAQ'}</span>
            <h2>{isAr ? 'كل ما تحتاج معرفته عن بطاقات لمسة' : 'Frequently Asked Questions'}</h2>
          </div>
          <div className="lt-faq-list">
            {[
              {
                q: isAr ? 'هل يحتاج الشخص الآخر إلى تحميل أي تطبيق لقراءة بطاقتي؟' : 'Does the other person need an app to tap my card?',
                a: isAr ? 'لا نهائياً! تعمل بطاقة لمسة بتقنية NFC المدمجة في جميع هواتف iPhone و Android الحديثة. بمجرد ملامسة البطاقة لظهر الهاتف تفتح صفحتك فورياً في المتصفح.' : 'No app is needed! Works natively with built-in NFC on modern smartphones.',
              },
              {
                q: isAr ? 'هل يمكنني تعديل روابطي وبياناتي بعد استلام البطاقة؟' : 'Can I update my links after receiving the physical card?',
                a: isAr ? 'نعم بكل تأكيد! يمكنك الدخول إلى لوحة التحكم وتغيير اسمك، صورتك، روابطك، وثيمك في أي وقت وتتحدث البطاقة فورياً دون الحاجة لشراء بطاقة جديدة.' : 'Yes! All changes update in real-time from your dashboard without reprinting.',
              },
              {
                q: isAr ? 'كيف يتم تفعيل البطاقة بعد الشراء؟' : 'How is my card activated after purchase?',
                a: isAr ? 'بمجرد إتمام طلبك من المتجر، يتم ربط وتفعيل حسابك رسمياً وشحن البطاقة الذكية المبرمجة إلى عنوانك.' : 'Your card is activated upon order completion and shipped ready-to-use.',
              },
            ].map((faq, idx) => (
              <div key={idx} className={`lt-faq-item ${faqOpen === idx ? 'open' : ''}`} onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}>
                <div className="lt-faq-q">
                  <b>{faq.q}</b>
                  <span>{faqOpen === idx ? '−' : '+'}</span>
                </div>
                {faqOpen === idx && <p className="lt-faq-a">{faq.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BOTTOM FLOATING CTA */}
      <section className="lt-bottom-cta">
        <div className="container" style={{ textAlign: 'center' }}>
          <h2>{isAr ? 'احجز اسمك ورابطك الذكي اليوم 🚀' : 'Claim your unique link today 🚀'}</h2>
          <p style={{ maxWidth: 600, margin: '12px auto 28px', opacity: 0.9 }}>
            {isAr ? 'انضم لنخبة صناع المحتوى والأطباء ورواد الأعمال وابدأ في مشاركة أعمالك بلمسة واحدة.' : 'Join thousands of creators & professionals sharing their world in one tap.'}
          </p>
          <form className="lt-claim-box" onSubmit={handleClaimSubmit} style={{ margin: '0 auto', maxWidth: 480 }}>
            <div className="lt-claim-input-wrap">
              <span className="lt-claim-prefix">lamsa.ink/</span>
              <input
                type="text"
                className="lt-claim-input"
                placeholder={isAr ? 'اسمك' : 'yourname'}
                value={claimName}
                onChange={(e) => setClaimName(e.target.value)}
                dir="ltr"
              />
            </div>
            <button type="submit" className="lt-claim-btn">
              {isAr ? 'ابدأ الآن' : 'Get started'}
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}
