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

  useEffect(() => {
    if (!product) return
    const title = isAr ? `${product.nameAr} | Lamsa` : `${product.nameEn} | Lamsa`
    const desc = isAr ? product.descAr : product.descEn
    document.title = title
    const metaDesc = document.querySelector('meta[name="description"]')
    if (metaDesc) metaDesc.setAttribute('content', desc)
    const ogTitle = document.querySelector('meta[property="og:title"]')
    if (ogTitle) ogTitle.setAttribute('content', title)
    const ogDesc = document.querySelector('meta[property="og:description"]')
    if (ogDesc) ogDesc.setAttribute('content', desc)
    const ogImage = document.querySelector('meta[property="og:image"]')
    if (ogImage) ogImage.setAttribute('content', `https://lamsa.ink/img/${product.img}`)
    const canonical = document.querySelector('link[rel="canonical"]')
    if (canonical) canonical.setAttribute('href', `https://lamsa.ink/store/${product.id}`)
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
                    <img src={`/img/${img}`} alt={`${product.nameEn} thumbnail ${i + 1}`} loading="lazy" />
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

              {/* Share */}
              <div className="pd-share">
                <span className="pd-share-label">{isAr ? 'مشاركة' : 'Share'}:</span>
                <div className="pd-share-btns">
                  <a href={`https://wa.me/?text=${encodeURIComponent(isAr ? `شوف ${product.nameAr} على Lamsa` : `Check ${product.nameEn} on Lamsa`)}%20https://lamsa.ink/store/${product.id}`} target="_blank" rel="noreferrer" className="pd-share-btn" style={{ background: '#25D366' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  </a>
                  <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://lamsa.ink/store/${product.id}`)}`} target="_blank" rel="noreferrer" className="pd-share-btn" style={{ background: '#1877F2' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </a>
                  <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(isAr ? `شوف ${product.nameAr} على Lamsa` : `Check ${product.nameEn} on Lamsa`)}&url=${encodeURIComponent(`https://lamsa.ink/store/${product.id}`)}`} target="_blank" rel="noreferrer" className="pd-share-btn" style={{ background: '#000' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
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
          <h2>{isAr ? 'مستعد تبدأ؟' : 'Ready to start?'}</h2>
          <p>{isAr ? 'سجّل دلوقتي وابدأ رحلتك الرقمية' : 'Sign up now and start your digital journey'}</p>
          <div className="hero-actions" style={{ justifyContent: 'center' }}>
            <Link to="/store" className="btn btn-primary">{isAr ? 'اطلب الآن' : 'Order now'}</Link>
            <Link to="/" className="btn btn-ghost">{isAr ? 'العودة للرئيسية' : 'Back to home'}</Link>
          </div>
        </div>
      </section>

      {/* Product Structured Data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Product",
        "name": product.nameEn,
        "description": product.descEn,
        "image": `https://lamsa.ink/img/${product.img}`,
        "brand": { "@type": "Brand", "name": "Lamsa" },
        "sku": product.id,
        "offers": {
          "@type": "Offer",
          "url": `https://lamsa.ink/store/${product.id}`,
          "priceCurrency": "EGP",
          "price": product.price,
          "availability": "https://schema.org/InStock",
          "seller": { "@type": "Organization", "name": "Lamsa" }
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.8",
          "reviewCount": "250"
        }
      }) }} />
    </div>
  )
}
