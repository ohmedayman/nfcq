import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLang } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { useProducts } from '../context/ProductContext'
import { CURRENCY } from '../data/content'
import { createOrder, saveProfile } from '../lib/firebase'
import { FIREBASE_READY } from '../firebase.config'
import { toast } from '../components/Toast'
import { sanitizeText } from '../lib/utils'
import {
  NfcIcon, IconCreditCard, IconZap, IconShield, IconPlus, IconMinus,
  IconCheck, IconWhatsApp, IconPhone, IconVerified
} from '../components/icons'
import StandardCard from '../components/StandardCard'
import PremiumCard from '../components/PremiumCard'

function getCart() {
  try { return JSON.parse(localStorage.getItem('lamsa_cart') || '{}') } catch { return {} }
}
function saveCart(c) { localStorage.setItem('lamsa_cart', JSON.stringify(c)) }

const STEPS = ['cart', 'shipping', 'done']

export default function Store() {
  const { text, lang } = useLang()
  const { user } = useAuth()
  const { products } = useProducts()
  const isAr = lang === 'ar'
  const nav = useNavigate()
  const [cart, setCartState] = useState(getCart)
  const [pending, setPending] = useState(false)
  const [step, setStep] = useState('cart')
  const [form, setForm] = useState({
    name: user?.displayName || '',
    phone: '',
    address: '',
    city: '',
    notes: '',
    paymentMethod: 'wallet', // 'wallet' or 'cod'
    walletNumber: '',
  })
  const [copiedNum, setCopiedNum] = useState(false)
  const [createdOrder, setCreatedOrder] = useState(null)
  const [selectedVariants, setSelectedVariants] = useState({})
  const [appliedCoupon, setAppliedCoupon] = useState({
    code: 'LAMSA',
    type: 'percent',
    value: 50,
    labelEn: '50% OFF (Launch Offer)',
    labelAr: 'خصم 50% (عرض الإطلاق)',
  })

  // Live countdown timer — resets daily at midnight
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 })
  useEffect(() => {
    function calcTimeLeft() {
      const now = new Date()
      const midnight = new Date(now)
      midnight.setHours(23, 59, 59, 999)
      const diff = midnight - now
      return {
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      }
    }
    setTimeLeft(calcTimeLeft())
    const interval = setInterval(() => setTimeLeft(calcTimeLeft()), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const custom = params.get('custom_name') || localStorage.getItem('lamsa_custom_engrave')
      if (custom) {
        setForm((f) => ({ ...f, notes: f.notes ? f.notes : `الاسم المحفور بالليزر: ${custom}` }))
      }
    } catch {}
  }, [])

  useEffect(() => { saveCart(cart) }, [cart])

  const setCart = (fn) => setCartState((prev) => {
    const next = typeof fn === 'function' ? fn(prev) : fn
    return next
  })

  const customMeta = (() => {
    try { return JSON.parse(localStorage.getItem('lamsa_custom_meta') || '{}') } catch { return {} }
  })()

  const items = Object.entries(cart).map(([cartKey, qty]) => {
    if (!qty || qty <= 0) return null
    const parts = cartKey.split('_')
    const prodId = parts[0]
    const sub = parts[1] || null
    const product = products.find((p) => p.id === prodId)
    if (!product) return null

    const meta = customMeta[cartKey] || {}
    const isLaser = sub === 'laser' || meta.type === 'laser'
    const isPrint = sub === 'print' || meta.type === 'print'
    const customCost = meta.cost ?? (isLaser ? 85 : isPrint ? 50 : 0)
    const customType = meta.type || (isLaser ? 'laser' : isPrint ? 'print' : 'none')
    const customTypeName = meta.typeName || (isLaser ? (isAr ? 'حفر بالليزر (+85 ج.م)' : 'Laser Engraved (+85 EGP)') : isPrint ? (isAr ? 'طباعة بالألوان UV (+50 ج.م)' : 'UV Color Print (+50 EGP)') : (isAr ? 'بدون تخصيص' : 'Standard'))
    const customText = meta.text || localStorage.getItem('lamsa_custom_engrave') || ''
    const unitPrice = product.price + customCost

    return {
      cartKey,
      product,
      qty,
      unitPrice,
      customCost,
      customType,
      customTypeName,
      customText,
      variant: sub && !['laser', 'print', 'none'].includes(sub) ? sub : null,
    }
  }).filter(Boolean)

  const total = items.reduce((s, x) => s + x.unitPrice * x.qty, 0)

  // Coupon discount — only applied when a valid coupon is entered
  const VALID_COUPONS = {
    'LAMSA': { type: 'percent', value: 50, labelEn: '50% OFF', labelAr: 'خصم 50%' },
    'LAMSA50': { type: 'percent', value: 50, labelEn: '50% OFF', labelAr: 'خصم 50%' },
    'LAMSA20': { type: 'percent', value: 20, labelEn: '20% OFF', labelAr: 'خصم 20%' },
    'WELCOME': { type: 'fixed', value: 50, labelEn: '50 EGP OFF', labelAr: 'خصم 50 ج.م' },
  }

  function applyCoupon() {
    const code = coupon.trim().toUpperCase()
    if (VALID_COUPONS[code]) {
      setAppliedCoupon({ code, ...VALID_COUPONS[code] })
      toast(isAr ? `تم تطبيق كوبون ${code} ✓` : `Coupon ${code} applied ✓`)
    } else {
      toast(isAr ? 'كود الخصم غير صالح' : 'Invalid coupon code', 'error')
    }
  }

  function removeCoupon() {
    setAppliedCoupon(null)
    setCoupon('')
    toast(isAr ? 'تم إزالة الكوبون' : 'Coupon removed')
  }

  let couponDiscount = 0
  if (appliedCoupon) {
    if (appliedCoupon.type === 'percent') {
      couponDiscount = Math.round((total * appliedCoupon.value) / 100)
    } else {
      couponDiscount = Math.min(total, appliedCoupon.value)
    }
  }

  const netTotal = Math.max(0, total - couponDiscount)
  const isDigitalOnly = items.length > 0 && items.every((i) => i.product.digital === true)
  const shipping = isDigitalOnly || netTotal >= 500 ? 0 : 50
  const grandTotal = netTotal + shipping

  const setQty = (cartKey, qty) => setCart((c) => {
    const n = { ...c, [cartKey]: Math.max(0, qty) }
    if (n[cartKey] === 0) delete n[cartKey]
    return n
  })

  function copyVodafoneNumber() {
    navigator.clipboard.writeText('01028707543')
    setCopiedNum(true)
    toast(isAr ? 'تم نسخ الرقم (01028707543) ✓' : 'Number copied (01028707543) ✓')
    setTimeout(() => setCopiedNum(false), 2500)
  }

  function goToShipping() {
    if (items.length === 0) return toast(isAr ? 'أضف بطاقة أولًا' : 'Add a card first', 'error')
    if (!user) {
      toast(isAr ? 'يرجى تسجيل الدخول أو إنشاء حساب لإتمام الشراء' : 'Please sign in or create an account to complete your purchase', 'info')
      nav('/account?mode=register&redirect=/store')
      return
    }
    setStep('shipping')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function placeOrder() {
    if (!form.name || !form.phone) {
      return toast(isAr ? 'يرجى إدخال الاسم ورقم الهاتف' : 'Please enter your name and phone', 'error')
    }
    if (form.paymentMethod === 'wallet' && !form.walletNumber) {
      return toast(isAr ? 'يرجى كتابة رقم المحفظة أو اسم الحساب المحوّل منه' : 'Please enter your sender wallet number or account name', 'error')
    }

    setPending(true)
    try {
      // Authoritative server/catalog price verification against client tampering
      const verifiedItems = items.map((x) => {
        const catalogItem = PRODUCTS.find((p) => p.id === x.product.id) || x.product
        const validCustomCost = x.customType === 'laser' ? 85 : x.customType === 'print' ? 50 : 0
        const verifiedUnitPrice = catalogItem.price + validCustomCost
        const safeQty = Math.max(1, Math.min(99, parseInt(x.qty, 10) || 1))
        return {
          id: catalogItem.id,
          name: isAr ? catalogItem.nameAr : catalogItem.nameEn,
          qty: safeQty,
          price: verifiedUnitPrice,
          basePrice: catalogItem.price,
          customType: x.customType || 'none',
          customTypeName: x.customTypeName || (isAr ? 'بدون تخصيص' : 'Standard'),
          customText: sanitizeText(x.customText || '').slice(0, 100),
          customCost: validCustomCost,
          variant: x.variant || null,
          digital: catalogItem.digital || false,
        }
      })

      const verifiedSubtotal = verifiedItems.reduce((s, i) => s + (i.price * i.qty), 0)
      let verifiedDiscount = 0
      if (appliedCoupon) {
        if (appliedCoupon.type === 'percent') {
          verifiedDiscount = Math.round((verifiedSubtotal * appliedCoupon.value) / 100)
        } else {
          verifiedDiscount = Math.min(verifiedSubtotal, appliedCoupon.value)
        }
      }
      const verifiedNet = Math.max(0, verifiedSubtotal - verifiedDiscount)
      const verifiedDigitalOnly = verifiedItems.every((i) => i.digital === true)
      const verifiedShipping = verifiedDigitalOnly || verifiedNet >= 500 ? 0 : 50
      const verifiedGrandTotal = verifiedNet + verifiedShipping

      const orderPayload = {
        items: verifiedItems,
        total: verifiedGrandTotal,
        subtotal: verifiedSubtotal,
        discount: verifiedDiscount,
        couponCode: appliedCoupon?.code || null,
        shipping: verifiedShipping,
        currency: CURRENCY[lang],
        customer: {
          name: sanitizeText(form.name || user?.displayName || '').slice(0, 100),
          phone: sanitizeText(form.phone || '').slice(0, 25),
          email: sanitizeText(form.email || user?.email || '').toLowerCase().slice(0, 100),
          city: sanitizeText(form.city || '').slice(0, 80),
          address: sanitizeText(form.address || '').slice(0, 250),
          notes: sanitizeText(form.notes || '').slice(0, 500),
        },
        paymentMethod: form.paymentMethod === 'wallet' ? 'wallet' : 'cod',
        walletNumber: sanitizeText(form.walletNumber || '').slice(0, 30),
        status: 'pending',
      }

      const orderResult = await createOrder(user?.uid || 'guest', orderPayload)
      if (user?.uid) {
        await saveProfile(user.uid, { activated: true })
      }

      setCreatedOrder(orderResult)
      setCart({})
      localStorage.removeItem('lamsa_custom_meta')
      setStep('done')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      toast(isAr ? 'تم تسجيل وتأكيد طلبك بنجاح! 🎉' : 'Order placed successfully! 🎉')
    } catch (err) {
      console.error('Order error:', err)
      toast(isAr ? 'تعذر إتمام الطلب، حاول مرة أخرى' : 'Could not place order, please try again', 'error')
    }
    setPending(false)
  }

  const stepIdx = STEPS.indexOf(step)

  return (
    <section className="section store-section">
      <div className="container">
        <nav className="pd-breadcrumb">
          <Link to="/">{isAr ? 'الرئيسية' : 'Home'}</Link>
          <span>/</span>
          <span className="pd-bc-current">{isAr ? 'المتجر' : 'Store'}</span>
        </nav>
        <div className="section-head">
          <span className="kicker">Lamsa NFC Store</span>
          <h2>{text.store_title}</h2>
          <p>{text.store_subtitle}</p>
        </div>

        {/* Progress steps */}
        {step !== 'done' && items.length > 0 && (
          <div className="checkout-progress">
            {[
              { n: 1, l: isAr ? 'السلة' : 'Cart' },
              { n: 2, l: isAr ? 'الشحن والدفع' : 'Shipping & Payment' },
              { n: 3, l: isAr ? 'التأكيد' : 'Confirm' },
            ].map((s, i) => (
              <div key={s.n} className={`checkout-step ${s.n <= stepIdx + 1 ? 'active' : ''} ${s.n < stepIdx + 1 ? 'done' : ''}`}>
                <div className="checkout-step-num">{s.n < stepIdx + 1 ? '✓' : s.n}</div>
                <div className="checkout-step-label">{s.l}</div>
                {i < 2 && <div className={`checkout-step-line ${s.n < stepIdx + 1 ? 'done' : ''}`} />}
              </div>
            ))}
          </div>
        )}

        {/* LUXURY ORDER SUCCESS VIEW */}
        {step === 'done' ? (
          <div className="order-success-luxury">
            <div className="os-badge-top">
              <span className="os-check-icon">✓</span>
            </div>
            
            <h2 className="os-title">{isAr ? 'تهانينا! تم استلام طلبك بنجاح 🎉' : 'Congratulations! Your order is confirmed 🎉'}</h2>
            <p className="os-sub">
              {isAr
                ? 'تم تسجيل طلبك وتفعيل حساب بطاقتك الذكية. سيتم التواصل معك والشحن في أسرع وقت.'
                : 'Your order is booked and your NFC card account is activated.'}
            </p>

            {createdOrder && (
              <div className="os-details-card">
                <div className="os-row os-order-id">
                  <span>{isAr ? 'رقم الطلب:' : 'Order ID:'}</span>
                  <b>#{createdOrder.id}</b>
                </div>

                <div className="os-row">
                  <span>{isAr ? 'الاسم:' : 'Name:'}</span>
                  <b>{createdOrder.customer?.name}</b>
                </div>

                <div className="os-row">
                  <span>{isAr ? 'الهاتف:' : 'Phone:'}</span>
                  <b>{createdOrder.customer?.phone}</b>
                </div>

                <div className="os-row">
                  <span>{isAr ? 'طريقة الدفع:' : 'Payment Method:'}</span>
                  <b style={{ color: createdOrder.paymentMethod === 'wallet' ? '#16a34a' : '#d97706' }}>
                    {createdOrder.paymentMethod === 'wallet' ? (isAr ? '📱 محفظة إلكترونية / إنستاباي' : 'Electronic Wallet / InstaPay') : (isAr ? '💵 دفع عند الاستلام' : 'Cash on Delivery')}
                  </b>
                </div>

                {createdOrder.paymentMethod === 'wallet' && (
                  <div className="os-wallet-reminder">
                    <p style={{ margin: '0 0 6px', fontWeight: 800 }}>{isAr ? 'بيانات التحويل عبر فودافون كاش / إنستاباي:' : 'Payment details:'}</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, background: 'rgba(0,0,0,0.06)', padding: '8px 12px', borderRadius: 10 }}>
                      <b style={{ fontSize: '1.1rem', letterSpacing: '1px' }}>01028707543</b>
                      <button className="btn btn-ghost btn-sm" onClick={copyVodafoneNumber}>
                        {copiedNum ? (isAr ? 'تم النسخ ✓' : 'Copied ✓') : (isAr ? '📋 نسخ الرقم' : 'Copy')}
                      </button>
                    </div>
                    {createdOrder.walletNumber && (
                      <small style={{ display: 'block', marginTop: 6, opacity: 0.8 }}>
                        {isAr ? `رقم التحويل المسجل: ${createdOrder.walletNumber}` : `Sender account: ${createdOrder.walletNumber}`}
                      </small>
                    )}
                  </div>
                )}

                <div className="os-row os-total-row">
                  <span>{isAr ? 'المبلغ الإجمالي:' : 'Total Amount:'}</span>
                  <b className="os-total-amount">{createdOrder.total} {createdOrder.currency || 'ج.م'}</b>
                </div>
              </div>
            )}

            {/* Direct WhatsApp Confirmation Button */}
            <div className="os-actions-wrap">
              <a
                href={`https://wa.me/201028707543?text=${encodeURIComponent(`مرحباً إدارة لمسة NFC 👋، قمت بطلب بطاقة ذكية رقم #${createdOrder?.id || ''} بقيمة ${createdOrder?.total || ''} ج.م. الاسم: ${createdOrder?.customer?.name || ''}، الهاتف: ${createdOrder?.customer?.phone || ''}. أرجو تأكيد الطلب والشحن.`)}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-whatsapp-direct"
              >
                <IconWhatsApp size="1.3em" /> {isAr ? '💬 تأكيد الطلب فوراً عبر واتساب (01028707543)' : 'Confirm on WhatsApp (01028707543)'}
              </a>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 14, flexWrap: 'wrap' }}>
                <Link to="/dashboard" className="btn btn-primary">
                  {isAr ? '🚀 الانتقال للوحة التحكم وضبط روابطي' : 'Go to Dashboard'}
                </Link>
                <Link to="/store" className="btn btn-ghost" onClick={() => { setStep('cart'); setCreatedOrder(null) }}>
                  {isAr ? '🛒 العودة للمتجر' : 'Back to Store'}
                </Link>
              </div>
            </div>
          </div>
        ) : items.length === 0 ? (
          <>
            <div className="store-grid">
              {products.map((p) => {
                const currentVariant = selectedVariants[p.id] || (p.variants ? p.variants[0].id : null)
                const cartKey = currentVariant ? `${p.id}_${currentVariant}` : p.id
                const inCart = cart[cartKey] || 0
                return (
                <div className={`pcard${p.popular ? ' hot' : ''}`} key={p.id}>
                  {p.popular && <span className="pop">{isAr ? 'الأكثر مبيعًا' : 'Popular'}</span>}
                  {p.originalPrice && <span className="pcard-discount">-50%</span>}
                  <Link to={`/store/${p.id}`} className="pcard-visual" style={{ background: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {p.id === 'classic' ? (
                      <div style={{ pointerEvents: 'none', transform: 'scale(0.8)', width: '100%' }}><StandardCard /></div>
                    ) : p.id === 'premium' ? (
                      <div style={{ pointerEvents: 'none', transform: 'scale(0.8)', width: '100%' }}><PremiumCard /></div>
                    ) : (
                      <img src={`/img/${p.img}`} alt={p.nameEn} loading="lazy" />
                    )}
                  </Link>
                  <div className="pcard-body">
                    <h3><Link to={`/store/${p.id}`}>{isAr ? p.nameAr : p.nameEn}</Link></h3>
                    <p className="pcard-material">{isAr ? p.materialAr : p.materialEn}</p>

                    {p.variants && (
                      <div className="variant-selector">
                        <span className="variant-label">{isAr ? 'اللون' : 'Color'}:</span>
                        <div className="variant-options">
                          {p.variants.map((v) => (
                            <button
                              key={v.id}
                              className={`variant-btn ${currentVariant === v.id ? 'active' : ''}`}
                              onClick={(e) => { e.preventDefault(); setSelectedVariants({ ...selectedVariants, [p.id]: v.id }) }}
                              style={{ background: v.id === 'black' ? '#1a1a2e' : '#f5f5f5', border: v.id === 'black' ? '2px solid #333' : '2px solid #ddd' }}
                              title={isAr ? v.nameAr : v.nameEn}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    <ul className="specs">
                      {(isAr ? p.specs.ar : p.specs.en).map((s, i) => (
                        <li key={i}><span className="i">✓</span>{s}</li>
                      ))}
                    </ul>
                    <div className="price">
                      {p.originalPrice && <span className="price-old">{p.originalPrice} {CURRENCY[lang]}</span>}
                      <b>{p.price}</b><small>{CURRENCY[lang]}</small>
                    </div>
                    <div className="pcard-btns">
                      <button className="btn btn-primary btn-block" onClick={() => setQty(p.id, (cart[cartKey] || 0) + 1, currentVariant)}>
                        <IconCreditCard /> {inCart > 0 ? `${text.buy} (${inCart})` : text.buy}
                      </button>
                      <Link to={`/store/${p.id}`} className="btn btn-ghost btn-block pcard-detail">
                        {isAr ? 'التفاصيل' : 'Details'}
                      </Link>
                    </div>
                  </div>
                </div>
                )
              })}
            </div>
            <div className="store-trust">
              <div className="trust-item"><IconZap /> {isAr ? 'إصدار رقمي فوري' : 'Instant digital issue'}</div>
              <div className="trust-item"><IconShield /> {isAr ? 'شحن آمن وسريع' : 'Fast, secure shipping'}</div>
              <div className="trust-item"><IconCheck /> {isAr ? 'ضمان سنة' : '1-year warranty'}</div>
            </div>
          </>
        ) : step === 'cart' ? (
          <div className="store-checkout">
            {/* Cart items */}
            <div className="dash-card">
              <div className="dash-card-header">
                <h3>{isAr ? 'سلة الطلب' : 'Your cart'}</h3>
                <p>{items.length} {isAr ? 'منتج' : 'items'}</p>
              </div>
              {items.map((i) => {
                const hasDiscount = i.product.originalPrice && i.product.originalPrice > i.product.price
                const discountPct = hasDiscount ? Math.round((1 - i.product.price / i.product.originalPrice) * 100) : 0
                return (
                  <div key={i.cartKey} className="cart-item">
                    <div className="cart-item-img" style={{ background: i.product.color }}>
                      <img src={`/img/${i.product.img}`} alt={i.product.nameEn} loading="lazy" />
                    </div>
                    <div className="cart-item-info">
                      <b>{isAr ? i.product.nameAr : i.product.nameEn}</b>
                      <small>{isAr ? i.product.materialAr : i.product.materialEn}</small>

                      {/* Customization Details Pill */}
                      {i.customType && i.customType !== 'none' && (
                        <div style={{ margin: '4px 0', padding: '3px 8px', borderRadius: 8, background: i.customType === 'laser' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(6, 182, 212, 0.12)', border: i.customType === 'laser' ? '1px solid #f59e0b' : '1px solid #06b6d4', display: 'inline-block', fontSize: '0.74rem', fontWeight: 800 }}>
                          {i.customType === 'laser' ? '⚡️' : '🖨️'} {i.customTypeName} {i.customText && `• "${i.customText}"`}
                        </div>
                      )}

                      <div className="cart-item-price">
                        <span className="price-now">{i.unitPrice} {CURRENCY[lang]}</span>
                        {hasDiscount && <span className="price-old">{i.product.originalPrice + i.customCost} {CURRENCY[lang]}</span>}
                        {hasDiscount && <span className="discount-badge">-{discountPct}%</span>}
                      </div>
                    </div>
                    <div className="cart-item-qty">
                      <button className="qty-btn" onClick={() => setQty(i.cartKey, i.qty - 1)}><IconMinus /></button>
                      <span className="qty-val">{i.qty}</span>
                      <button className="qty-btn" onClick={() => setQty(i.cartKey, i.qty + 1)}><IconPlus /></button>
                    </div>
                    <button className="cart-item-remove" onClick={() => setQty(i.cartKey, 0)} title={isAr ? 'حذف' : 'Remove'}>✕</button>
                  </div>
                )
              })}
            </div>

            {/* Sidebar */}
            <div className="cart-sidebar">
              <div className="cart-sidebar-card">
                <div className="cart-sidebar-title">{isAr ? 'ملخص الطلب' : 'Order summary'}</div>

                {/* Luxury Urgency Card */}
                {!isDigitalOnly && (
                  <div className="cart-urgency-luxury">
                    <div className="cul-top">
                      <span className="cul-badge">🔥 {isAr ? 'خصم 50% مفعل تلقائياً' : '50% Auto Applied'}</span>
                      <span className="cul-discount">كود: LAMSA</span>
                    </div>
                    <div className="cul-content">
                      <div className="cul-info">
                        <b>{isAr ? 'اغتنم عرض الإطلاق قبل انتهائه' : 'Claim launch deal before expiry'}</b>
                        <small>{isAr ? 'ينتهي السعر المخفض لطلبك خلال:' : 'Discount expires in:'}</small>
                      </div>
                      <div className="cul-timer">
                        <div className="cul-digit">
                          <b>{String(timeLeft.h).padStart(2, '0')}</b>
                          <small>{isAr ? 'ساعة' : 'hr'}</small>
                        </div>
                        <span className="cul-sep">:</span>
                        <div className="cul-digit">
                          <b>{String(timeLeft.m).padStart(2, '0')}</b>
                          <small>{isAr ? 'دقيقة' : 'min'}</small>
                        </div>
                        <span className="cul-sep">:</span>
                        <div className="cul-digit">
                          <b>{String(timeLeft.s).padStart(2, '0')}</b>
                          <small>{isAr ? 'ثانية' : 'sec'}</small>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="cart-summary">
                  <div className="cart-summary-row">
                    <span>{isAr ? 'المجموع الفرعي' : 'Subtotal'}</span>
                    <span>{total} {CURRENCY[lang]}</span>
                  </div>
                  {couponDiscount > 0 && (
                    <div className="cart-summary-row" style={{ color: '#22c55e' }}>
                      <span>{isAr ? 'الخصم' : 'Discount'} ({appliedCoupon?.code})</span>
                      <span>-{couponDiscount} {CURRENCY[lang]}</span>
                    </div>
                  )}
                  <div className="cart-summary-row">
                    <span>{isAr ? 'الشحن' : 'Shipping'}</span>
                    {isDigitalOnly ? (
                      <span className="cart-free-ship">✓ {isAr ? 'مجاني' : 'Free'}</span>
                    ) : (
                      <span>{shipping} {CURRENCY[lang]}</span>
                    )}
                  </div>
                  {!isDigitalOnly && (
                    <div className="cart-free-ship">✓ {isAr ? 'شحن مجاني للطلبات فوق 500 ج.م' : 'Free shipping over 500 EGP'}</div>
                  )}
                  <div className="cart-summary-row cart-total">
                    <span>{isAr ? 'الإجمالي' : 'Total'}</span>
                    <span>{grandTotal} {CURRENCY[lang]}</span>
                  </div>
                </div>

                {/* Coupon */}
                {appliedCoupon ? (
                  <div className="cart-coupon cart-coupon-applied">
                    <div className="coupon-applied-info">
                      <span className="coupon-applied-code">{appliedCoupon.code}</span>
                      <span className="coupon-applied-label">{isAr ? appliedCoupon.labelAr : appliedCoupon.labelEn}</span>
                    </div>
                    <button onClick={removeCoupon} className="coupon-remove-btn">✕</button>
                  </div>
                ) : (
                  <div className="cart-coupon">
                    <input type="text" placeholder={isAr ? 'كود الخصم' : 'Coupon code'} value={coupon} onChange={(e) => setCoupon(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && applyCoupon()} />
                    <button onClick={applyCoupon}>{isAr ? 'تطبيق' : 'Apply'}</button>
                  </div>
                )}

                <button className="cart-pay-btn" onClick={goToShipping}>
                  {isAr ? 'متابعة الشحن والدفع' : 'Proceed to Checkout'} — {grandTotal} {CURRENCY[lang]}
                </button>

                <div className="cart-secure">
                  <span>🔒</span>
                  <span>{isAr ? 'دفع آمن ومشفر' : 'Secure encrypted checkout'}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="store-checkout">
            {/* Review */}
            <div className="dash-card">
              <div className="dash-card-header">
                <h3>{isAr ? 'مراجعة المنتجات' : 'Order review'}</h3>
              </div>
              {items.map((i) => {
                const hasDiscount = i.product.originalPrice && i.product.originalPrice > i.product.price
                return (
                  <div key={i.product.id} className="cart-item" style={{ padding: '12px 0' }}>
                    <div className="cart-item-img" style={{ background: i.product.color, width: 56, height: 56 }}>
                      <img src={`/img/${i.product.img}`} alt={i.product.nameEn} loading="lazy" />
                    </div>
                    <div className="cart-item-info">
                      <b style={{ fontSize: '0.92rem' }}>{isAr ? i.product.nameAr : i.product.nameEn}</b>
                      <small>{isAr ? i.product.materialAr : i.product.materialEn}</small>
                      <div className="cart-item-price" style={{ marginTop: 4 }}>
                        <span className="price-now" style={{ fontSize: '0.95rem' }}>{i.product.price} {CURRENCY[lang]}</span>
                        {hasDiscount && <span className="price-old" style={{ fontSize: '0.8rem' }}>{i.product.originalPrice} {CURRENCY[lang]}</span>}
                      </div>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>×{i.qty}</div>
                  </div>
                )
              })}
              <div className="cart-summary">
                <div className="cart-summary-row">
                  <span>{isAr ? 'المجموع' : 'Subtotal'}</span>
                  <span>{total} {CURRENCY[lang]}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="cart-summary-row" style={{ color: '#22c55e' }}>
                    <span>{isAr ? 'خصم الكوبون' : 'Coupon discount'} ({appliedCoupon?.code})</span>
                    <span>-{couponDiscount} {CURRENCY[lang]}</span>
                  </div>
                )}
                <div className="cart-summary-row">
                  <span>{isAr ? 'الشحن' : 'Shipping'}</span>
                  {isDigitalOnly || shipping === 0 ? (
                    <span className="cart-free-ship">✓ {isAr ? 'مجاني' : 'Free'}</span>
                  ) : (
                    <span>{shipping} {CURRENCY[lang]}</span>
                  )}
                </div>
                <div className="cart-summary-row cart-total">
                  <span>{isAr ? 'الإجمالي' : 'Total'}</span>
                  <span>{grandTotal} {CURRENCY[lang]}</span>
                </div>
              </div>
            </div>

            {/* Shipping form & Payment selector */}
            <div className="dash-card">
              <div className="dash-card-header">
                <h3>{isAr ? 'بيانات التوصيل والدفع' : 'Shipping & Payment'}</h3>
              </div>

              <div className="field">
                <label>{isAr ? 'الاسم بالكامل' : 'Full Name'} *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={isAr ? 'مثال: محمد أيمن' : 'e.g. John Doe'}
                />
              </div>

              <div className="form-row">
                <div className="field">
                  <label>{isAr ? 'رقم الهاتف (للتوصيل والواتساب)' : 'Phone Number'} *</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="010XXXXXXXX"
                    dir="ltr"
                  />
                </div>
                <div className="field">
                  <label>{isAr ? 'البريد الإلكتروني' : 'Email'}</label>
                  <input
                    type="email"
                    value={form.email || user?.email || ''}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@email.com"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="field">
                  <label>{isAr ? 'المحافظة / المدينة' : 'City / Region'} *</label>
                  <input
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder={isAr ? 'القاهرة، الجيزة، الإسكندرية…' : 'Cairo, Giza…'}
                  />
                </div>
                <div className="field">
                  <label>{isAr ? 'العنوان بالتفصيل' : 'Street Address'} *</label>
                  <input
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder={isAr ? 'اسم الشارع، رقم العمارة، الشقة' : 'Street, building, apt'}
                  />
                </div>
              </div>

              {/* PAYMENT METHOD CHOOSER */}
              <div className="payment-method-box" style={{ marginTop: 20, marginBottom: 20 }}>
                <label style={{ display: 'block', fontWeight: 800, marginBottom: 10, fontSize: '0.95rem' }}>
                  {isAr ? '💳 اختر طريقة الدفع:' : '💳 Select Payment Method:'}
                </label>

                <div className="pm-options-grid">
                  {/* Option 1: Electronic Wallets / Vodafone Cash / InstaPay */}
                  <div
                    className={`pm-option-card ${form.paymentMethod === 'wallet' ? 'selected' : ''}`}
                    onClick={() => setForm({ ...form, paymentMethod: 'wallet' })}
                  >
                    <div className="pm-opt-header">
                      <input
                        type="radio"
                        name="pm"
                        checked={form.paymentMethod === 'wallet'}
                        onChange={() => setForm({ ...form, paymentMethod: 'wallet' })}
                      />
                      <b>{isAr ? '📱 محافظ إلكترونية / إنستاباي' : 'Electronic Wallet / InstaPay'}</b>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--muted)', margin: '4px 0 0' }}>
                      {isAr ? 'فودافون كاش، إنستاباي، أورنج كاش، اتصالات كاش، وي باي' : 'Vodafone Cash, InstaPay, Orange, Etisalat, WE Pay'}
                    </p>
                  </div>

                  {/* Option 2: Cash on Delivery */}
                  <div
                    className={`pm-option-card ${form.paymentMethod === 'cod' ? 'selected' : ''}`}
                    onClick={() => setForm({ ...form, paymentMethod: 'cod' })}
                  >
                    <div className="pm-opt-header">
                      <input
                        type="radio"
                        name="pm"
                        checked={form.paymentMethod === 'cod'}
                        onChange={() => setForm({ ...form, paymentMethod: 'cod' })}
                      />
                      <b>{isAr ? '💵 الدفع عند الاستلام (COD)' : 'Cash on Delivery'}</b>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--muted)', margin: '4px 0 0' }}>
                      {isAr ? 'ادفع لمندوب الشحن نقداً عند استلام البطاقة وتجربتها' : 'Pay in cash when you receive your card'}
                    </p>
                  </div>
                </div>

                {/* If Electronic Wallet is selected, show Vodafone Cash instruction card */}
                {form.paymentMethod === 'wallet' && (
                  <div className="pm-wallet-instructions">
                    <div className="pm-wi-head">
                      <span style={{ fontSize: '1.2rem' }}>📱</span>
                      <div>
                        <b>{isAr ? 'تحويل فودافون كاش أو إنستاباي إلى الرقم:' : 'Transfer Vodafone Cash / InstaPay to:'}</b>
                      </div>
                    </div>

                    <div className="pm-number-copy-row">
                      <span className="pm-target-num">01028707543</span>
                      <button type="button" className="btn btn-primary btn-sm" onClick={copyVodafoneNumber}>
                        {copiedNum ? (isAr ? 'تم النسخ ✓' : 'Copied ✓') : (isAr ? '📋 نسخ الرقم' : 'Copy Number')}
                      </button>
                    </div>

                    <div className="field" style={{ marginTop: 12, marginBottom: 0 }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 800 }}>
                        {isAr ? 'رقم المحفظة أو اسم الحساب المحوّل منه *' : 'Sender Wallet Number / Account Name *'}
                      </label>
                      <input
                        value={form.walletNumber}
                        onChange={(e) => setForm({ ...form, walletNumber: e.target.value })}
                        placeholder={isAr ? 'مثال: 010XXXXXXXX أو اسمك في إنستاباي' : 'e.g. 010XXXXXXXX or InstaPay username'}
                        dir="ltr"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="field">
                <label>{isAr ? 'ملاحظات إضافية على الطلب' : 'Order Notes'}</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  placeholder={isAr ? 'أي تعليمات خاصة للتوصيل أو التصميم…' : 'Any special notes for delivery…'}
                />
              </div>

              <div className="checkout-actions">
                <button className="btn btn-ghost" onClick={() => setStep('cart')}>
                  ← {isAr ? 'العودة للسلة' : 'Back to cart'}
                </button>
                <button className="btn btn-primary btn-lg" onClick={placeOrder} disabled={pending}>
                  <IconCheck /> {pending ? (isAr ? 'جاري تأكيد الطلب…' : 'Processing…') : (isAr ? `تأكيد الطلب (${grandTotal} ${CURRENCY[lang]}) 🚀` : `Confirm Order (${grandTotal} ${CURRENCY[lang]}) 🚀`)}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
