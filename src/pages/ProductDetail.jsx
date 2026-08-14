import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useLang } from '../context/LanguageContext'
import { useProducts } from '../context/ProductContext'
import { CURRENCY } from '../data/content'
import Reveal from '../components/Reveal'
import { toast } from '../components/Toast'
import { NfcIcon, IconShield, IconRefresh, IconCheck, IconPlus, IconMinus, IconVerified } from '../components/icons'
import StandardCard from '../components/StandardCard'
import PremiumCard from '../components/PremiumCard'
import LiveCard3D from '../components/LiveCard3D'

function getCart() {
  try { return JSON.parse(localStorage.getItem('lamsa_cart') || '{}') } catch { return {} }
}
function saveCart(c) { localStorage.setItem('lamsa_cart', JSON.stringify(c)) }

const REVIEWS = [
  { name: 'د. طارق الحسين', role: 'استشاري جراحة', stars: 5, date: 'منذ يومين', comment: 'جودة الحفر بالليزر على البطاقة المعدنية مذهلة جداً، وسرعة قراءة الـ NFC على هواتف الآيفون والأندرويد فورية بدون أي تأخير.' },
  { name: 'م. يوسف الغامدي', role: 'رئيس تنفيذي', stars: 5, date: 'منذ أسبوع', comment: 'أفضل استثمار لشركتنا في مؤتمرات الأعمال. وفرت علينا آلاف الكروت الورقية وأعطت انطباعاً راقياً جداً أمام العملاء.' },
  { name: 'نوران شريف', role: 'صانعة محتوى ومصممة', stars: 5, date: 'منذ أسبوعين', comment: 'سهولة تعديل الروابط والبروفايل من الداشبورد تجعلها الحل الأفضل بدون منازع. شكراً لفريق لمسة!' },
]

const CUSTOM_PRICES = {
  none: 0,
  print: 50,
  laser: 85,
}

export default function ProductDetail() {
  const { id } = useParams()
  const { lang } = useLang()
  const { products } = useProducts()
  const isAr = lang === 'ar'
  const nav = useNavigate()
  const product = products.find((p) => p.id === id)
  const [activeImg, setActiveImg] = useState(0)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const [customType, setCustomType] = useState('none') // 'none' | 'print' | 'laser'
  const [customName, setCustomName] = useState('')
  const [fontStyle, setFontStyle] = useState('modern')
  const [logoUrl, setLogoUrl] = useState(null)
  const [tapActive, setTapActive] = useState(false)

  useEffect(() => { window.scrollTo(0, 0) }, [id])

  useEffect(() => {
    if (!product) return
    const title = isAr ? `${product.nameAr} | Lamsa` : `${product.nameEn} | Lamsa`
    const desc = isAr ? product.descAr : product.descEn
    document.title = title
    const metaDesc = document.querySelector('meta[name="description"]')
    if (metaDesc) metaDesc.setAttribute('content', desc)
  }, [product, isAr])

  if (!product) {
    return (
      <section className="section">
        <div className="container" style={{ textAlign: 'center' }}>
          <h2>{isAr ? 'المنتج غير موجود' : 'Product not found'}</h2>
          <p style={{ color: 'var(--muted)', margin: '16px 0 28px' }}>{isAr ? 'المنتج الذي تبحث عنه غير متاح.' : 'The product you are looking for does not exist.'}</p>
          <Link to="/store" className="btn btn-primary">{isAr ? 'العودة للمتجر' : 'Back to store'}</Link>
        </div>
      </section>
    )
  }

  const ar = isAr
  const features = ar ? product.featuresAr : product.featuresEn
  const specs = ar ? product.specs.ar : product.specs.en
  const similar = products.filter((p) => p.id !== id)

  const customCost = CUSTOM_PRICES[customType] || 0
  const unitPrice = product.price + customCost
  const totalPrice = unitPrice * qty

  function addToCart() {
    const cart = getCart()
    const cartKey = customType !== 'none' ? `${id}_${customType}` : id
    cart[cartKey] = (cart[cartKey] || 0) + qty
    saveCart(cart)

    // Save custom engraving metadata
    const customMeta = JSON.parse(localStorage.getItem('lamsa_custom_meta') || '{}')
    if (customType !== 'none') {
      customMeta[cartKey] = {
        type: customType,
        typeName: customType === 'laser' ? (isAr ? 'حفر بالليزر (+85 ج.م)' : 'Laser Engraved (+85 EGP)') : (isAr ? 'طباعة بالألوان UV (+50 ج.م)' : 'UV Color Print (+50 EGP)'),
        text: customName || 'اسم مخصص',
        cost: customCost,
      }
      localStorage.setItem('lamsa_custom_engrave', customName)
    } else {
      delete customMeta[cartKey]
    }
    localStorage.setItem('lamsa_custom_meta', JSON.stringify(customMeta))

    setAdded(true)
    toast(isAr ? 'تمت إضافة البطاقة إلى السلة ✓' : 'Card added to cart ✓')
    setTimeout(() => setAdded(false), 2000)
  }

  function buyNow() {
    addToCart()
    nav(`/store?custom_type=${customType}&custom_name=${encodeURIComponent(customName || '')}&custom_cost=${customCost}`)
  }

  function triggerTap() {
    setTapActive(true)
    setTimeout(() => setTapActive(false), 1200)
  }

  return (
    <div className="pd-page">
      {/* Breadcrumb */}
      <div className="container">
        <nav className="pd-breadcrumb">
          <Link to="/">{isAr ? 'الرئيسية' : 'Home'}</Link>
          <span>/</span>
          <Link to="/store">{isAr ? 'المتجر' : 'Store'}</Link>
          <span>/</span>
          <span className="pd-bc-current">{ar ? product.nameAr : product.nameEn}</span>
        </nav>
      </div>

      {/* Hero Section */}
      <section className="section pd-hero">
        <div className="container pd-grid">
          <Reveal>
            <div className="pd-gallery">
              {/* Main Image / 3D Showcase */}
              <div className={`pd-main-img ${tapActive ? 'tap-pulse' : ''}`} style={{ background: product.color, minHeight: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {customType !== 'none' || activeImg === 0 ? (
                  <LiveCard3D
                    productName={ar ? product.nameAr : product.nameEn}
                    material={product.id === 'premium' ? 'carbon' : product.id === 'executive' ? 'gold' : 'metal'}
                    customType={customType}
                    customName={customName}
                    fontStyle={fontStyle}
                    logoUrl={logoUrl}
                    color={product.color}
                    isAr={isAr}
                  />
                ) : (
                  <img src={`/img/${product.gallery[activeImg]}`} alt={product.nameEn} />
                )}
                {product.popular && <span className="pd-badge">{ar ? 'الأكثر مبيعًا' : 'Best Seller'}</span>}
                {product.originalPrice && <span className="pd-discount-badge">-50%</span>}
              </div>

              {/* Thumbnails */}
              <div className="pd-thumbs">
                {product.gallery.map((img, i) => (
                  <button
                    key={i}
                    className={`pd-thumb ${i === activeImg ? 'on' : ''}`}
                    onClick={() => setActiveImg(i)}
                    style={{ background: product.color }}
                  >
                    <img src={`/img/${img}`} alt={`${product.nameEn} thumbnail ${i + 1}`} loading="lazy" />
                  </button>
                ))}
              </div>

              {/* Live Tap Simulation Box */}
              <div className="pd-gif-section" onClick={triggerTap} style={{ cursor: 'pointer' }}>
                <div className="pd-gif-header">
                  <NfcIcon size={20} />
                  <span>{isAr ? 'تجربة اللمس الذكي (اضغط هنا للمحاكاة)' : 'Tap simulator (Click to test)'}</span>
                </div>
                <div className={`pd-tap-sim-box ${tapActive ? 'active' : ''}`}>
                  <div className="pts-ripple" />
                  <span style={{ fontSize: '2.5rem' }}>📱⚡️💳</span>
                  <b>{isAr ? (tapActive ? 'تم الاتصال ونقل البيانات بنجاح! ✓' : 'انقر لتجربة سرعة قراءة الـ NFC') : (tapActive ? 'Beam Connected! ✓' : 'Click to simulate NFC Tap')}</b>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={150}>
            <div className="pd-info">
              <span className="pd-material">{ar ? product.materialAr : product.materialEn}</span>
              <h1>{ar ? product.nameAr : product.nameEn}</h1>
              <p className="pd-desc">{ar ? product.descAr : product.descEn}</p>

              {/* Price Box */}
              <div className="pd-price-box">
                <div className="pd-price-main">
                  {product.originalPrice && (
                    <span className="pd-price-old">{product.originalPrice + customCost} {CURRENCY[lang]}</span>
                  )}
                  <span className="pd-price"><b>{unitPrice}</b><small>{CURRENCY[lang]}</small></span>
                  {product.originalPrice && (
                    <span className="pd-price-badge">-50%</span>
                  )}
                </div>
                <span className="pd-stock">{isAr ? '✓ متوفر فوراً والشحن لجميع المحافظات' : '✓ In stock & fast shipping'}</span>
              </div>

              {/* Custom Laser Engraving or UV Printing Choice */}
              {!product.digital && (
                <div className="pd-engrave-box" style={{ background: 'var(--surface, rgba(0,0,0,0.03))', border: '1.5px solid var(--line)', borderRadius: 20, padding: 18, margin: '18px 0' }}>
                  <label style={{ fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, fontSize: '0.95rem' }}>
                    <span>✨ {isAr ? 'تخصيص الاسم والبراند على البطاقة:' : 'Card Customization & Branding:'}</span>
                    {customCost > 0 && <span style={{ color: 'var(--cobalt)', fontWeight: 800 }}>+{customCost} {CURRENCY[lang]}</span>}
                  </label>

                  {/* 3 Choice Buttons */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(95px, 1fr))', gap: 8, marginBottom: 14 }}>
                    <button
                      type="button"
                      className={`btn-custom-opt ${customType === 'none' ? 'active' : ''}`}
                      onClick={() => setCustomType('none')}
                      style={{
                        padding: '12px 8px',
                        borderRadius: 14,
                        border: customType === 'none' ? '2px solid var(--cobalt)' : '1.5px solid var(--line)',
                        background: customType === 'none' ? 'rgba(24, 84, 232, 0.08)' : 'var(--card)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                        textAlign: 'center',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <span style={{ fontSize: '1.2rem' }}>⚪️</span>
                      <b style={{ fontSize: '0.82rem' }}>{isAr ? 'بدون اسم' : 'Standard'}</b>
                      <small style={{ color: 'var(--muted)', fontSize: '0.72rem' }}>{isAr ? 'بدون رسوم' : '0 EGP'}</small>
                    </button>

                    <button
                      type="button"
                      className={`btn-custom-opt ${customType === 'print' ? 'active' : ''}`}
                      onClick={() => setCustomType('print')}
                      style={{
                        padding: '12px 8px',
                        borderRadius: 14,
                        border: customType === 'print' ? '2px solid #06b6d4' : '1.5px solid var(--line)',
                        background: customType === 'print' ? 'rgba(6, 182, 212, 0.08)' : 'var(--card)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                        textAlign: 'center',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <span style={{ fontSize: '1.2rem' }}>🖨️</span>
                      <b style={{ fontSize: '0.82rem' }}>{isAr ? 'طباعة ألوان' : 'Color UV'}</b>
                      <small style={{ color: '#0284c7', fontWeight: 800, fontSize: '0.72rem' }}>+50 {CURRENCY[lang]}</small>
                    </button>

                    <button
                      type="button"
                      className={`btn-custom-opt ${customType === 'laser' ? 'active' : ''}`}
                      onClick={() => setCustomType('laser')}
                      style={{
                        padding: '12px 8px',
                        borderRadius: 14,
                        border: customType === 'laser' ? '2px solid #f59e0b' : '1.5px solid var(--line)',
                        background: customType === 'laser' ? 'rgba(245, 158, 11, 0.08)' : 'var(--card)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                        textAlign: 'center',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <span style={{ fontSize: '1.2rem' }}>⚡️</span>
                      <b style={{ fontSize: '0.82rem' }}>{isAr ? 'حفر ليزر فاخر' : 'Laser Engraved'}</b>
                      <small style={{ color: '#d97706', fontWeight: 800, fontSize: '0.72rem' }}>+85 {CURRENCY[lang]}</small>
                    </button>
                  </div>

                  {/* Input field when customType is print or laser */}
                  {customType !== 'none' && (
                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text)', display: 'block', marginBottom: 6 }}>
                        {customType === 'laser'
                          ? (isAr ? '✍️ الاسم أو النص المطلوب حفره بالليزر (+85 ج.م):' : 'Laser Engraved Name (+85 EGP):')
                          : (isAr ? '🎨 الاسم أو النص المطلوب طباعته بالألوان (+50 ج.م):' : 'UV Printed Name (+50 EGP):')
                        }
                      </label>
                      <input
                        type="text"
                        placeholder={isAr ? 'مثال: د. محمد أيمن / Milano' : 'e.g. Dr. Mohamed / Milano'}
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid var(--line)', background: 'var(--card)', fontWeight: 800, marginBottom: 12 }}
                        autoFocus
                      />

                      {/* Font Style Switcher */}
                      <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
                        🔤 {isAr ? 'نمط الخط للطباعة أو الحفر:' : 'Engraving / Print Font Style:'}
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 12 }}>
                        {[
                          { id: 'modern', label: isAr ? 'هندسي' : 'Modern' },
                          { id: 'luxury', label: isAr ? 'ملكي' : 'Luxury' },
                          { id: 'english', label: isAr ? 'إنجليزي' : 'English' },
                          { id: 'tech', label: isAr ? 'تقني' : 'Tech' },
                        ].map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => setFontStyle(f.id)}
                            style={{
                              padding: '6px 4px',
                              borderRadius: 8,
                              border: fontStyle === f.id ? '1.5px solid var(--cobalt)' : '1px solid var(--line)',
                              background: fontStyle === f.id ? 'rgba(24, 84, 232, 0.1)' : 'var(--card)',
                              color: fontStyle === f.id ? 'var(--cobalt)' : 'var(--text)',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                            }}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>

                      {/* Logo Uploader */}
                      <div style={{ background: 'rgba(0,0,0,0.03)', padding: '10px 12px', borderRadius: 12, border: '1px dashed var(--line)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text)' }}>
                            🖼️ {isAr ? 'معاينة لوجو شركتك على الكارت (اختياري):' : 'Company Logo Preview (Optional):'}
                          </span>
                          {logoUrl && (
                            <button
                              type="button"
                              onClick={() => setLogoUrl(null)}
                              style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 800 }}
                            >
                              ✕ {isAr ? 'إزالة' : 'Remove'}
                            </button>
                          )}
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const f = e.target.files?.[0]
                            if (!f) return
                            const r = new FileReader()
                            r.onload = (ev) => {
                              setLogoUrl(ev.target.result)
                              toast(isAr ? 'تم تطبيق الشعار على مجسم البطاقة 3D بنجاح ✓' : 'Logo preview applied to 3D card! ✓')
                            }
                            r.readAsDataURL(f)
                          }}
                          style={{ fontSize: '0.75rem', marginTop: 6 }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Quantity */}
              <div className="pd-qty-row">
                <span className="pd-qty-label">{isAr ? 'العدد' : 'Quantity'}</span>
                <div className="pd-qty">
                  <button className="qty-btn" onClick={() => setQty(Math.max(1, qty - 1))}>
                    <IconMinus />
                  </button>
                  <span className="qty-val">{qty}</span>
                  <button className="qty-btn" onClick={() => setQty(qty + 1)}>
                    <IconPlus />
                  </button>
                </div>
                <span className="pd-qty-total">{totalPrice} {CURRENCY[lang]}</span>
              </div>

              {/* Actions */}
              <div className="pd-actions">
                <button className="btn btn-primary btn-lg btn-block" onClick={addToCart}>
                  {added
                    ? (isAr ? '✓ تم الإضافة للسلة' : '✓ Added')
                    : <><NfcIcon size={18} /> {isAr ? `أضف للسلة (${totalPrice} ${CURRENCY[lang]})` : `Add to cart (${totalPrice} ${CURRENCY[lang]})`}</>
                  }
                </button>
                <button className="btn btn-ghost btn-lg btn-block" onClick={buyNow}>
                  {isAr ? '🛒 شراء فوري وتفعيل' : 'Buy now'}
                </button>
              </div>

              {/* Share */}
              <div className="pd-share">
                <span className="pd-share-label">{isAr ? 'مشاركة' : 'Share'}:</span>
                <div className="pd-share-btns">
                  <a href={`https://wa.me/?text=${encodeURIComponent(isAr ? `شوف ${product.nameAr} على Lamsa` : `Check ${product.nameEn} on Lamsa`)}%20https://lamsa.ink/store/${product.id}`} target="_blank" rel="noreferrer" className="pd-share-btn" style={{ background: '#25D366' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  </a>
                  <button className="pd-share-btn" style={{ background: 'var(--cobalt)' }} onClick={() => { navigator.clipboard.writeText(`https://lamsa.ink/store/${product.id}`); toast(isAr ? 'تم نسخ الرابط ✓' : 'Link copied ✓') }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                  </button>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="pd-trust-row">
                <div className="pd-trust-item">
                  <NfcIcon size={18} />
                  <span>{isAr ? 'NFC فوري بدون برامج' : 'Zero App NFC'}</span>
                </div>
                <div className="pd-trust-item">
                  <IconShield size={18} />
                  <span>{isAr ? 'ضمان استبدال شامل' : 'Full warranty'}</span>
                </div>
                <div className="pd-trust-item">
                  <IconRefresh size={18} />
                  <span>{isAr ? 'تعديلات مجانية مدى الحياة' : 'Free edits'}</span>
                </div>
              </div>

              {/* Specs */}
              <div className="pd-specs">
                <h3>{isAr ? 'المواصفات الفنية' : 'Specifications'}</h3>
                <ul>
                  {specs.map((s, i) => (
                    <li key={i}>
                      <span className="pd-spec-check"><IconCheck size={14} /></span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Features Section */}
      <section className="section section-alt">
        <div className="container">
          <Reveal>
            <div className="section-head">
              <span className="kicker">{isAr ? 'المميزات' : 'Features'}</span>
              <h2>{isAr ? 'ليه تختار البطاقة دي؟' : 'Why choose this card?'}</h2>
            </div>
          </Reveal>
          <div className="pd-features">
            {features.map((f, i) => (
              <Reveal key={i} delay={i * 80}>
                <div className="pd-feat-card">
                  <div className="pd-feat-num">{String(i + 1).padStart(2, '0')}</div>
                  <h4>{f.t}</h4>
                  <p>{f.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Verified Reviews Section */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="kicker">{isAr ? 'آراء العملاء' : 'Customer Reviews'}</span>
            <h2>{isAr ? 'تقييمات وتجارب المشترين ⭐️' : 'Verified Buyer Reviews ⭐️'}</h2>
            <p>{isAr ? 'تقييم 4.9 من 5 بناءً على أكثر من 2,500 عميل في مصر والخليج' : 'Rated 4.9/5 based on 2,500+ verified users'}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {REVIEWS.map((r, idx) => (
              <div key={idx} style={{ background: 'var(--card)', border: '1.5px solid var(--line)', borderRadius: 20, padding: 22, boxShadow: '0 8px 24px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <b style={{ fontSize: '1rem' }}>{r.name}</b>
                    <IconVerified size="1.1em" />
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{r.date}</span>
                </div>
                <div style={{ color: '#f59e0b', fontSize: '1rem', marginBottom: 8 }}>{'★'.repeat(r.stars)}</div>
                <p style={{ fontSize: '0.88rem', color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>"{r.comment}"</p>
                <div style={{ marginTop: 12, fontSize: '0.78rem', color: 'var(--cobalt)', fontWeight: 700 }}>
                  🏷️ {r.role} · {isAr ? 'مشتري موثق ✓' : 'Verified Buyer ✓'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section section-alt">
        <div className="container">
          <Reveal>
            <div className="section-head">
              <span className="kicker">{isAr ? 'خطوات' : 'Steps'}</span>
              <h2>{isAr ? 'إزاي تبدأ؟' : 'How to get started?'}</h2>
            </div>
          </Reveal>
          <div className="pd-steps">
            {[
              { n: '01', t: isAr ? 'سجّل حسابك واكتب اسمك' : 'Sign up', d: isAr ? 'إنشاء حساب مجاني وحجز رابطك في ثوانٍ' : 'Create a free account in seconds', icon: '👤' },
              { n: '02', t: isAr ? 'اختر الدفع (كاش أو محفظة)' : 'Checkout', d: isAr ? 'فودافون كاش، إنستاباي أو الدفع عند الاستلام' : 'Electronic wallet or Cash on delivery', icon: '💳' },
              { n: '03', t: isAr ? 'استلم بطاقتك مفعلة' : 'Receive card', d: isAr ? 'تصلك مبرمجة ومحفورة وجاهزة للاستخدام' : 'Card arrives ready to use', icon: '📦' },
            ].map((s, i) => (
              <Reveal key={i} delay={i * 120}>
                <div className="pd-step">
                  <div className="pd-step-icon">{s.icon}</div>
                  <div className="pd-step-n">{s.n}</div>
                  <h4>{s.t}</h4>
                  <p>{s.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Similar products */}
      <section className="section">
        <div className="container">
          <Reveal>
            <div className="section-head">
              <span className="kicker">{isAr ? 'منتجات مشابهة' : 'You may also like'}</span>
              <h2>{isAr ? 'بطاقات أخرى فاخرة' : 'Other cards'}</h2>
            </div>
          </Reveal>
          <div className="pd-similar">
            {similar.map((p, i) => (
              <Reveal key={p.id} delay={i * 120}>
                <Link to={`/store/${p.id}`} className="pd-similar-card">
                  <div className="pd-similar-img" style={{ background: p.color }}>
                    <img src={`/img/${p.img}`} alt={p.nameEn} loading="lazy" />
                    {p.originalPrice && <span className="pd-similar-badge">-50%</span>}
                  </div>
                  <div className="pd-similar-body">
                    <h4>{ar ? p.nameAr : p.nameEn}</h4>
                    <p className="pd-similar-mat">{ar ? p.materialAr : p.materialEn}</p>
                    <div className="pd-similar-price">
                      {p.originalPrice && <span className="price-old">{p.originalPrice} {CURRENCY[lang]}</span>}
                      <b>{p.price}</b><small>{CURRENCY[lang]}</small>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-band">
        <div className="container cta-inner">
          <h2>{isAr ? 'مستعد لامتلاك بطاقتك الذكية؟' : 'Ready to get your smart card?'}</h2>
          <p>{isAr ? 'اطلب الآن واستمتع بمشاركة أعمالك وروابطك بلمسة واحدة.' : 'Order now and experience networking in one tap.'}</p>
          <div className="hero-actions" style={{ justifyContent: 'center' }}>
            <Link to="/store" className="btn btn-primary">{isAr ? '🛒 تصفح المتجر واطلب' : '🛒 Order now'}</Link>
            <Link to="/" className="btn btn-ghost">{isAr ? 'العودة للرئيسية' : 'Back to home'}</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
