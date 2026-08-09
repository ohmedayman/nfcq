import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useLang } from '../context/LanguageContext'
import { PRODUCTS, CURRENCY } from '../data/content'
import Reveal from '../components/Reveal'
import { NfcIcon, IconShield, IconRefresh, IconCheck, IconPlus, IconMinus } from '../components/icons'

function getCart() {
  try { return JSON.parse(localStorage.getItem('lamsa_cart') || '{}') } catch { return {} }
}
function saveCart(c) { localStorage.setItem('lamsa_cart', JSON.stringify(c)) }

export default function ProductDetail() {
  const { id } = useParams()
  const { lang } = useLang()
  const isAr = lang === 'ar'
  const nav = useNavigate()
  const product = PRODUCTS.find((p) => p.id === id)
  const [activeImg, setActiveImg] = useState(0)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  useEffect(() => { window.scrollTo(0, 0) }, [id])

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
  const similar = PRODUCTS.filter((p) => p.id !== id)

  function addToCart() {
    const cart = getCart()
    cart[id] = (cart[id] || 0) + qty
    saveCart(cart)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  function buyNow() {
    addToCart()
    nav('/store')
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
              {/* Main Image / GIF */}
              <div className="pd-main-img" style={{ background: product.color }}>
                <img src={`/img/${product.gallery[activeImg]}`} alt={product.nameEn} />
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
                    <img src={`/img/${img}`} alt="" />
                  </button>
                ))}
              </div>

              {/* GIF Showcase */}
              <div className="pd-gif-section">
                <div className="pd-gif-header">
                  <NfcIcon size={20} />
                  <span>{isAr ? 'شاهد البطاقة بالعمل' : 'See the card in action'}</span>
                </div>
                <div className="pd-gif-placeholder">
                  <div className="pd-gif-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" opacity="0.2"/>
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                  </div>
                  <p>{isAr ? 'أضف فيديو أو GIF هنا' : 'Add video or GIF here'}</p>
                  <span className="pd-gif-hint">placeholder.gif</span>
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
                    <span className="pd-price-old">{product.originalPrice} {CURRENCY[lang]}</span>
                  )}
                  <span className="pd-price"><b>{product.price}</b><small>{CURRENCY[lang]}</small></span>
                  {product.originalPrice && (
                    <span className="pd-price-badge">-50%</span>
                  )}
                </div>
                <span className="pd-stock">{isAr ? '✓ متوفر فوراً' : '✓ In stock'}</span>
              </div>

              {/* Quantity */}
              <div className="pd-qty-row">
                <span className="pd-qty-label">{isAr ? 'الكمية' : 'Quantity'}</span>
                <div className="pd-qty">
                  <button className="qty-btn" onClick={() => setQty(Math.max(1, qty - 1))}>
                    <IconMinus />
                  </button>
                  <span className="qty-val">{qty}</span>
                  <button className="qty-btn" onClick={() => setQty(qty + 1)}>
                    <IconPlus />
                  </button>
                </div>
                <span className="pd-qty-total">{product.price * qty} {CURRENCY[lang]}</span>
              </div>

              {/* Actions */}
              <div className="pd-actions">
                <button className="btn btn-primary btn-lg btn-block" onClick={addToCart}>
                  {added
                    ? (isAr ? '✓ تم الإضافة' : '✓ Added')
                    : <><NfcIcon size={18} /> {isAr ? 'أضف للسلة' : 'Add to cart'}</>
                  }
                </button>
                <button className="btn btn-ghost btn-lg btn-block" onClick={buyNow}>
                  {isAr ? 'اشتري الآن' : 'Buy now'}
                </button>
              </div>

              {/* Trust Badges */}
              <div className="pd-trust-row">
                <div className="pd-trust-item">
                  <NfcIcon size={18} />
                  <span>{isAr ? 'NFC فوري' : 'Instant NFC'}</span>
                </div>
                <div className="pd-trust-item">
                  <IconShield size={18} />
                  <span>{isAr ? 'ضمان شامل' : 'Full warranty'}</span>
                </div>
                <div className="pd-trust-item">
                  <IconRefresh size={18} />
                  <span>{isAr ? 'تعديلات مجانية' : 'Free edits'}</span>
                </div>
              </div>

              {/* Specs */}
              <div className="pd-specs">
                <h3>{isAr ? 'المواصفات' : 'Specifications'}</h3>
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

      {/* How it works */}
      <section className="section">
        <div className="container">
          <Reveal>
            <div className="section-head">
              <span className="kicker">{isAr ? 'خطوات' : 'Steps'}</span>
              <h2>{isAr ? 'إزاي تبدأ؟' : 'How to get started?'}</h2>
            </div>
          </Reveal>
          <div className="pd-steps">
            {[
              { n: '01', t: isAr ? 'سجّل حسابك' : 'Sign up', d: isAr ? 'إنشاء حساب مجاني في ثوانٍ' : 'Create a free account in seconds', icon: '👤' },
              { n: '02', t: isAr ? 'ادفع وأكمل' : 'Checkout', d: isAr ? 'اختر طريقة الدفع المناسبة لك' : 'Choose your preferred payment method', icon: '💳' },
              { n: '03', t: isAr ? 'استلم بطاقتك' : 'Receive card', d: isAr ? product.digital ? 'صفحتك جاهزة فوراً' : 'البطاقة توصلك خلال 3-5 أيام' : product.digital ? 'Your page is ready instantly' : 'Card arrives in 3-5 days', icon: product.digital ? '🚀' : '📦' },
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
      <section className="section section-alt">
        <div className="container">
          <Reveal>
            <div className="section-head">
              <span className="kicker">{isAr ? 'منتجات مشابهة' : 'You may also like'}</span>
              <h2>{isAr ? 'بطاقات تانية' : 'Other cards'}</h2>
            </div>
          </Reveal>
          <div className="pd-similar">
            {similar.map((p, i) => (
              <Reveal key={p.id} delay={i * 120}>
                <Link to={`/store/${p.id}`} className="pd-similar-card">
                  <div className="pd-similar-img" style={{ background: p.color }}>
                    <img src={`/img/${p.img}`} alt={p.nameEn} />
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
          <h2>{isAr ? 'مستعد تبدأ؟' : 'Ready to start?'}</h2>
          <p>{isAr ? 'سجّل دلوقتي وابدأ رحلتك الرقمية' : 'Sign up now and start your digital journey'}</p>
          <div className="hero-actions" style={{ justifyContent: 'center' }}>
            <Link to="/store" className="btn btn-primary">{isAr ? 'اطلب الآن' : 'Order now'}</Link>
            <Link to="/" className="btn btn-ghost">{isAr ? 'العودة للرئيسية' : 'Back to home'}</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
