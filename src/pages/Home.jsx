import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { useLang } from '../context/LanguageContext'
import { CURRENCY } from '../data/content'
import { useProducts } from '../context/ProductContext'
import Reveal from '../components/Reveal'
import {
  NfcIcon, IconUser, IconRefresh, IconShield, IconZap, IconCheck, IconPhone,
  IconYouTube, IconFacebook, IconTikTok, IconTelegram, IconWhatsApp, IconInstagram,
  IconLinkedin, IconTwitter, PlatformIcon, IconVerified, IconShare, IconMail, IconPin
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

// 6 TAILORED PERSONAS FOR DIFFERENT INDUSTRIES
const PERSONAS = [
  {
    id: 'doctor',
    titleAr: 'الأطباء والعيادات 🩺',
    titleEn: 'Doctors & Clinics 🩺',
    subtitleAr: 'حجز كشوفات، لوكيشن العيادة، مواعيد العمل، وتبادل بيانات المرضى',
    subtitleEn: 'Instant appointment booking, clinic location, and patient contact sharing',
    name: 'د. محمد أيمن',
    role: 'استشاري جراحة العظام · القاهرة',
    bio: 'عيادات الصفوة التخصصية · الكشف بالحجز المسبق · متاح استشارات أونلاين',
    avatar: '👨‍⚕️',
    theme: 'midnight-gold',
    socials: { whatsapp: '01028707543', facebook: 'dr.mohamed', youtube: 'dr_mohamed_clinics', instagram: 'dr_mohamed' },
    links: [
      { label: 'احجز كشفك الآن أونلاين (فيزيتا)', sub: 'متاح مواعيد السبت والاثنين والأربعاء', icon: 'zap', color: '#10b981' },
      { label: 'موقع العيادة على خرائط Google', sub: 'التجمع الخامس · مول ميتينج بوينت', icon: 'pin', color: '#3b82f6' },
      { label: 'تحميل مواعيد ومحاضرات التغذية (PDF)', sub: 'كتيب نصائح مجاني لمرضى المفاصل', icon: 'zap', color: '#d97706' },
    ],
  },
  {
    id: 'creator',
    titleAr: 'صناع المحتوى والمؤثرين 🎨',
    titleEn: 'Creators & Influencers 🎨',
    subtitleAr: 'كل قنواتك وفيديوهاتك وروابط الرعاة في صفحة تضاهي Linktree Pro',
    subtitleEn: 'All your social channels, YouTube videos, and sponsor links in one spot',
    name: 'سارة ديزاين Studio',
    role: 'صانعة محتوى ومصممة واجهات UI/UX',
    bio: 'أشارك أسرار التصميم الحر وبناء المنتجات الرقمية الناجحة 🚀',
    avatar: '👩‍🎨',
    theme: 'rose-gold',
    socials: { youtube: 'sarah_design', instagram: 'sarah_ux', tiktok: 'sarah_designs', whatsapp: '01028707543' },
    links: [
      { label: 'قناتي على يوتيوب (دروس UI/UX مجانية)', sub: '250K Subscribers · كورس فيجما كامل', icon: 'youtube', color: '#FF0000' },
      { label: 'كتابي الإلكتروني: أسرار الفريلانسنج', sub: 'خصم 40% لفترة محدودة · تحميل فوري', icon: 'zap', color: '#ec4899' },
      { label: 'حجز جلسة استشارية 1:1 لتطوير معرض أعمالك', sub: 'جلسة زووم 45 دقيقة عبر Calendly', icon: 'zap', color: '#8b5cf6' },
    ],
  },
  {
    id: 'founder',
    titleAr: 'الشركات ورواد الأعمال 🏢',
    titleEn: 'Founders & Companies 🏢',
    subtitleAr: 'انطباع أول فخم في المؤتمرات والاجتماعات مع تبادل مباشر لبيانات العملاء',
    subtitleEn: 'High-end first impression at networking events with instant lead capture',
    name: 'كريم مهران',
    role: 'Founder & CEO @ Apex Tech Solutions',
    bio: 'نطور برمجيات الذكاء الاصطناعي والحلول السحابية للمؤسسات الكبرى ⚡',
    avatar: '💼',
    theme: 'cyber-neon',
    socials: { linkedin: 'karim-mehran', twitter: 'karim_tech', whatsapp: '01028707543', email: 'karim@apex.io' },
    links: [
      { label: 'موقع الشركة الرسمي واستعراض خدماتنا', sub: 'www.apex-solutions.com', icon: 'zap', color: '#06b6d4' },
      { label: 'تحميل البروفايل التعريفي للشركة (Company Deck)', sub: 'ملف PDF شامل كافة المشاريع السابقة', icon: 'zap', color: '#3b82f6' },
      { label: 'تحديد موعد اجتماع عمل (B2B Meeting)', sub: 'مباشرة عبر رزنامة المبيعات', icon: 'zap', color: '#10b981' },
    ],
  },
  {
    id: 'realestate',
    titleAr: 'العقارات والوسطاء 🏡',
    titleEn: 'Real Estate & Sales 🏡',
    subtitleAr: 'كتالوج المشروعات السكنية، بروشورات الـ PDF، ولوكيشن المعاينة بلمسة',
    subtitleEn: 'Project catalogs, brochure PDFs, and showroom pin in one tap',
    name: 'أحمد الشناوي',
    role: 'مستشار عقاري أول · العاصمة الإدارية والتجمع',
    bio: 'مساعدتك في اختيار أفضل فرصة استثمارية سكنية وتجارية بدون عمولة 🌟',
    avatar: '🏡',
    theme: 'emerald-vip',
    socials: { whatsapp: '01028707543', phone: '01028707543', facebook: 'elshinawy.re', instagram: 'shinawy_properties' },
    links: [
      { label: 'كتالوج أفضل المشروعات السكنية لعام 2026', sub: 'أسعار وأنظمة سداد تصل حتى 10 سنوات', icon: 'zap', color: '#10b981' },
      { label: 'واتساب مباشر لطلب دراسة الجدوى', sub: 'رد فوري 24/7 ومقارنة أسعار المطورين', icon: 'whatsapp', color: '#25D366' },
      { label: 'لوكيشن مقر المعاينة ومكاتب المبيعات', sub: 'القاهرة الجديدة · التسعين الشمالي', icon: 'pin', color: '#d97706' },
    ],
  },
  {
    id: 'restaurant',
    titleAr: 'المطاعم والكافيهات 🍽️',
    titleEn: 'Restaurants & Cafes 🍽️',
    subtitleAr: 'منيو إلكتروني ذكي، عروض اليوم، لوكيشن الفروع، وتقييم جوجل ماب',
    subtitleEn: 'Digital smart menu, daily deals, branches map, and Google reviews',
    name: 'Milano Gourmet Café',
    role: 'مطعم وكافيه إيطالي فاخر · المعادي والزمالك',
    bio: 'أشهى الأطباق الإيطالية الأصلية والقهوة المختصة ☕🍕',
    avatar: '☕',
    theme: 'midnight-gold',
    socials: { instagram: 'milanocafe_eg', facebook: 'milanogourmet', whatsapp: '01028707543', tiktok: 'milanocafe' },
    links: [
      { label: 'تصفح المنيو الإلكتروني الذكي (Digital Menu)', sub: 'قائمة الأطعمة، المشروبات، والحلويات بالأسعار', icon: 'zap', color: '#d97706' },
      { label: 'طلب توصيل فوري للمنازل (Delivery)', sub: 'خصم 20% على أول طلب أونلاين', icon: 'whatsapp', color: '#25D366' },
      { label: 'تقييم تجربتك على خرائط Google', sub: 'ساعدنا برأيك واحصل على هدية مجانية', icon: 'pin', color: '#3b82f6' },
    ],
  },
  {
    id: 'store',
    titleAr: 'المتاجر والبراندات 🛍️',
    titleEn: 'E-commerce & Fashion 🛍️',
    subtitleAr: 'عرض أحدث الكولكشن، كود الخصم، والتسوق المباشر بلمسة واحدة',
    subtitleEn: 'Showcase newest collections, discount codes, and 1-tap checkout',
    name: 'Milano Wear Egypt',
    role: 'أحدث صيحات الموضة والأزياء الرجالية',
    bio: 'شحن لجميع المحافظات · الدفع عند الاستلام · معاينة قبل الاستلام ✨',
    avatar: '🛍️',
    theme: 'cyber-neon',
    socials: { instagram: 'milano_eg', facebook: 'milanowear', tiktok: 'milano_wear', whatsapp: '01028707543' },
    links: [
      { label: 'تسوق كولكشن الصيف الجديد 2026', sub: 'خصومات تصل إلى 50% على جميع القطع', icon: 'zap', color: '#06b6d4' },
      { label: 'كود خصم حصري: LAMSA15', sub: 'احصل على 15% خصم إضافي عند الدفع', icon: 'zap', color: '#f59e0b' },
      { label: 'خدمة العملاء ومتابعة الشحنات (واتساب)', sub: 'متاح الرد 24 ساعة يومياً', icon: 'whatsapp', color: '#25D366' },
    ],
  },
]

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

const CARD_MATERIALS = [
  { id: 'matte-black', nameAr: 'أسود مطفي بريميوم', nameEn: 'Matte Black Pro', bg: '#0f172a', border: '#334155', accent: '#38bdf8' },
  { id: 'brushed-gold', nameAr: 'ذهب فينيسيا ملكي', nameEn: 'Luxury Gold Metal', bg: 'linear-gradient(135deg, #78350f, #d97706)', border: '#f59e0b', accent: '#fbbf24' },
  { id: 'emerald-carbon', nameAr: 'ألياف كربون زمردي', nameEn: 'Emerald Carbon VIP', bg: 'linear-gradient(135deg, #064e3b, #022c22)', border: '#10b981', accent: '#34d399' },
  { id: 'crystal-frost', nameAr: 'أبيض لؤلؤي سحابي', nameEn: 'Pearl Frost White', bg: 'linear-gradient(135deg, #f8fafc, #cbd5e1)', border: '#94a3b8', accent: '#0284c7', light: true },
]

export default function Home() {
  const { text, lang } = useLang()
  const { products } = useProducts()
  const isAr = lang === 'ar'
  const nav = useNavigate()

  const [claimName, setClaimName] = useState('')
  const [selectedPersona, setSelectedPersona] = useState(PERSONAS[0])
  const [activeTheme, setActiveTheme] = useState('midnight-gold')
  const [faqOpen, setFaqOpen] = useState(null)

  // 3D Card Studio State
  const [customCardName, setCustomCardName] = useState('')
  const [selectedMaterial, setSelectedMaterial] = useState(CARD_MATERIALS[0])
  const [cardTilted, setCardTilted] = useState(false)

  // NFC Tap Simulator State
  const [simTapped, setSimTapped] = useState(false)
  const [simRippling, setSimRippling] = useState(false)

  function handleClaimSubmit(e) {
    e.preventDefault()
    const clean = claimName.trim().replace(/^@/, '')
    if (clean) {
      nav(`/account?mode=register&username=${encodeURIComponent(clean)}&redirect=/store`)
    } else {
      nav(`/account?mode=register&redirect=/store`)
    }
  }

  function triggerNfcSimulation() {
    setSimRippling(true)
    setTimeout(() => {
      setSimTapped(true)
      setSimRippling(false)
    }, 600)
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
                  ? 'انضم لأكثر من 15,000 طبيب، صانع محتوى، ورائد أعمال. صفحة رقمية فائقة التخصيص وبطاقة NFC تفتح فوراً على أي هاتف بلمسة واحدة بدون أي تطبيقات!'
                  : 'Join 15,000+ creators, doctors and entrepreneurs. A high-converting digital profile and physical smart card ready in seconds.'}
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

      {/* ==========================================================================
          TAILORED PERSONA USE-CASES (حلول مفصلة ومصممة لكل تخصص)
          ========================================================================== */}
      <section className="section section-alt" style={{ overflow: 'hidden' }}>
        <div className="container">
          <div className="section-head">
            <span className="kicker">{isAr ? 'حلول مخصصة لكل مجال' : 'Tailored For Everyone'}</span>
            <h2>{isAr ? 'مصممة خصيصاً لتناسب مجالك وأعمالك 🎯' : 'Built for your exact industry'}</h2>
            <p>{isAr ? 'اختر تخصصك واستكشف كيف تجعل لمسة NFC تجربتك وتجربة عملائك أسهل وأفخم' : 'Select your field to preview a fully tailored smart profile'}</p>
          </div>

          {/* Persona Tabs Nav */}
          <div className="persona-nav-tabs">
            {PERSONAS.map((p) => (
              <button
                key={p.id}
                className={`persona-nav-btn ${selectedPersona.id === p.id ? 'active' : ''}`}
                onClick={() => setSelectedPersona(p)}
              >
                {isAr ? p.titleAr : p.titleEn}
              </button>
            ))}
          </div>

          {/* Persona Interactive Showcase Box */}
          <div className="persona-showcase-box">
            <div className="persona-showcase-info">
              <div className="persona-badge-tag">{isAr ? selectedPersona.titleAr : selectedPersona.titleEn}</div>
              <h3>{isAr ? selectedPersona.subtitleAr : selectedPersona.subtitleEn}</h3>
              <p className="persona-desc">
                {isAr
                  ? `تمنحك لمسة NFC صفحة ذكية متكاملة مصممة خصيصاً لتلبية احتياجات ${selectedPersona.name}، مع إمكانية مشاركة روابط حجز المواعيد، الكتالوج، والعروض بلمسة واحدة بهاتفك!`
                  : `Empower your brand with a smart digital profile customized with instant action buttons, catalogs, and 1-tap contact exchange.`}
              </p>

              <div className="persona-features-list">
                <div className="pfl-item">✅ {isAr ? 'حفظ جهة الاتصال مباشرة في هاتف العميل' : 'Instant Save Contact (.vcf)'}</div>
                <div className="pfl-item">✅ {isAr ? 'أزرار مخصصة لحجز المواعيد واستقبال الرسائل' : 'Custom booking & direct action buttons'}</div>
                <div className="pfl-item">✅ {isAr ? 'تعديل وتحديث الروابط في أي وقت بدون إعادة طباعة' : 'Instant live updates anytime'}</div>
              </div>

              <div style={{ marginTop: 24 }}>
                <Link to="/account?mode=register" className="btn btn-primary">
                  {isAr ? `ابدأ تخصيص صفحتك كـ ${selectedPersona.name.split(' ')[0]} 🚀` : 'Create your smart page now 🚀'}
                </Link>
              </div>
            </div>

            {/* Persona Live Interactive Mockup */}
            <div className="persona-showcase-phone">
              <div className={`lt-phone-mockup theme-${selectedPersona.theme}`}>
                <div className="lt-phone-notch" />
                <div className="lt-phone-screen">
                  <div className="lt-screen-cover" />
                  <div className="lt-screen-avatar">
                    <span>{selectedPersona.avatar}</span>
                  </div>

                  <div className="lt-screen-name-row">
                    <h3 className="lt-screen-name">{selectedPersona.name}</h3>
                    <IconVerified size="1.15em" />
                  </div>
                  <div className="lt-screen-role">{selectedPersona.role}</div>
                  <div className="lt-screen-bio">{selectedPersona.bio}</div>

                  {/* Socials */}
                  <div className="lt-screen-socials">
                    {selectedPersona.socials.youtube && <span className="lt-ss-btn" style={{ background: '#FF0000', color: '#fff' }}><IconYouTube /></span>}
                    {selectedPersona.socials.facebook && <span className="lt-ss-btn" style={{ background: '#1877F2', color: '#fff' }}><IconFacebook /></span>}
                    {selectedPersona.socials.tiktok && <span className="lt-ss-btn" style={{ background: '#000000', color: '#fff' }}><IconTikTok /></span>}
                    {selectedPersona.socials.whatsapp && <span className="lt-ss-btn" style={{ background: '#25D366', color: '#fff' }}><IconWhatsApp /></span>}
                    {selectedPersona.socials.instagram && <span className="lt-ss-btn" style={{ background: '#E4405F', color: '#fff' }}><IconInstagram /></span>}
                    {selectedPersona.socials.linkedin && <span className="lt-ss-btn" style={{ background: '#0A66C2', color: '#fff' }}><IconLinkedin /></span>}
                  </div>

                  {/* Links */}
                  <div className="lt-screen-links">
                    {selectedPersona.links.map((l, idx) => (
                      <div key={idx} className="lt-screen-link-item">
                        <span className="lt-sli-icon" style={{ background: l.color || '#3b82f6', color: '#fff' }}>
                          <IconZap />
                        </span>
                        <div className="lt-sli-text">
                          <b>{l.label}</b>
                          <span>{l.sub}</span>
                        </div>
                        <span className="lt-sli-arrow">{isAr ? '←' : '→'}</span>
                      </div>
                    ))}
                  </div>

                  <button className="lt-screen-vcard-btn">
                    💾 {isAr ? 'حفظ جهة الاتصال في الهاتف' : 'Save Contact'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================================
          INTERACTIVE 3D CARD STUDIO (استوديو تخصيص البطاقة الحية)
          ========================================================================== */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="kicker">{isAr ? 'استوديو البطاقات 3D' : '3D Card Customizer'}</span>
            <h2>{isAr ? 'صمم بطاقتك الذكية وشاهدها بالثلاثي الأبعاد 💳' : 'Customize your card & view in 3D'}</h2>
            <p>{isAr ? 'اكتب اسمك، اختر الخامة واللون، وشاهد تصميم بطاقتك الفاخرة يتشكل أمامك مباشرة' : 'Type your name, select material and preview your luxury NFC card live'}</p>
          </div>

          <div className="card-studio-grid">
            {/* Controls */}
            <div className="cs-controls">
              <div className="field" style={{ marginBottom: 20 }}>
                <label style={{ fontWeight: 800 }}>{isAr ? 'الاسم المحفور على البطاقة' : 'Name embossed on card'}</label>
                <input
                  type="text"
                  placeholder={isAr ? 'مثال: د. محمد أيمن / Milano' : 'e.g. Alex Rivera'}
                  value={customCardName}
                  onChange={(e) => setCustomCardName(e.target.value)}
                  style={{ width: '100%', padding: '14px 18px', borderRadius: 14, border: '2px solid var(--line)', fontSize: '1rem', fontWeight: 800 }}
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ fontWeight: 800, display: 'block', marginBottom: 10 }}>{isAr ? 'اختر خامة البطاقة الملكية:' : 'Choose Card Material:'}</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {CARD_MATERIALS.map((m) => (
                    <button
                      key={m.id}
                      className={`cs-mat-btn ${selectedMaterial.id === m.id ? 'active' : ''}`}
                      onClick={() => setSelectedMaterial(m)}
                    >
                      <span className="cs-mat-dot" style={{ background: m.bg, border: `1.5px solid ${m.border}` }} />
                      <span>{isAr ? m.nameAr : m.nameEn}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="cs-cta-box">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{isAr ? 'السعر يشمل البرمجة والشحن:' : 'Total Price:'}</span>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--cobalt)' }}>349 {isAr ? 'ج.م' : 'EGP'}</div>
                  </div>
                  <span className="badge-chip">⚡ {isAr ? 'شحن فوري لباب البيت' : 'Fast Delivery'}</span>
                </div>
                <Link
                  to={`/store?custom_name=${encodeURIComponent(customCardName || 'Lamsa Member')}&material=${selectedMaterial.id}`}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
                >
                  {isAr ? '🛒 اطلب هذه البطاقة الآن وتفعيل حسابك' : '🛒 Order this card & activate'}
                </Link>
              </div>
            </div>

            {/* 3D Render Canvas */}
            <div className="cs-preview-wrap">
              <div
                className={`cs-3d-card ${cardTilted ? 'tilted' : ''}`}
                style={{ background: selectedMaterial.bg, borderColor: selectedMaterial.border }}
                onMouseEnter={() => setCardTilted(true)}
                onMouseLeave={() => setCardTilted(false)}
              >
                <div className="cs-card-chip">
                  <div className="cs-chip-lines" />
                </div>

                <div className="cs-card-nfc-icon">
                  <NfcIcon size="2.2rem" />
                </div>

                <div className="cs-card-brand">
                  <span style={{ color: selectedMaterial.light ? '#0f172a' : '#fff', fontWeight: 900, letterSpacing: '0.1em' }}>LAMSA</span>
                  <span style={{ fontSize: '0.65rem', opacity: 0.8, color: selectedMaterial.light ? '#334155' : '#cbd5e1' }}>SMART NFC</span>
                </div>

                <div className="cs-card-bottom">
                  <div className="cs-card-name" style={{ color: selectedMaterial.light ? '#0f172a' : '#fff' }}>
                    {customCardName || (isAr ? 'اسمك هنا' : 'YOUR NAME')}
                  </div>
                  <div className="cs-card-qr">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=https://lamsa.ink&color=${selectedMaterial.light ? '0f172a' : 'ffffff'}&bgcolor=transparent`}
                      alt="QR"
                    />
                  </div>
                </div>

                {/* Shimmer Light Reflection */}
                <div className="cs-card-shimmer" />
              </div>
              <p style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--muted)', marginTop: 14 }}>
                {isAr ? '✨ مرر الماوس على البطاقة لرؤية انعكاس الضوء والحفر الليزري الفاخر' : '✨ Hover to see 3D light reflection'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3D CREATOR SHOWCASE CAROUSEL */}
      <section className="section section-alt" style={{ overflow: 'hidden' }}>
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
                        <Link to={`/${c.handle}`} className="btn btn-primary btn-sm">
                          {isAr ? 'معاينة البروفايل' : 'Preview profile'}
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

      {/* PRODUCTS PREVIEW */}
      <section className="section">
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
      <section className="section section-alt">
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
      <section className="section">
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
