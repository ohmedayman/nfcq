import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLang } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { PRODUCTS, CURRENCY } from '../data/content'
import { createOrder } from '../lib/firebase'
import { FIREBASE_READY } from '../firebase.config'
import { toast } from '../components/Toast'
import { NfcIcon, IconCreditCard, IconZap, IconShield, IconPlus, IconMinus, IconCheck } from '../components/icons'

function getCart() {
  try { return JSON.parse(localStorage.getItem('lamsa_cart') || '{}') } catch { return {} }
}
function saveCart(c) { localStorage.setItem('lamsa_cart', JSON.stringify(c)) }

const STEPS = ['cart', 'shipping', 'done']

export default function Store() {
  const { text, lang } = useLang()
  const isAr = lang === 'ar'
  const { user } = useAuth()
  const nav = useNavigate()
  const [cart, setCartState] = useState(getCart)
  const [pending, setPending] = useState(false)
  const [step, setStep] = useState('cart')
  const [form, setForm] = useState({ name: user?.displayName || '', phone: '', address: '', city: '', notes: '' })

  useEffect(() => { saveCart(cart) }, [cart])

  const setCart = (fn) => setCartState((prev) => {
    const next = typeof fn === 'function' ? fn(prev) : fn
    return next
  })

  const items = PRODUCTS.map((p) => ({ product: p, qty: cart[p.id] || 0 })).filter((x) => x.qty > 0)
  const total = items.reduce((s, x) => s + x.product.price * x.qty, 0)
  const isDigitalOnly = items.length > 0 && items.every((x) => x.product.digital)
  const shipping = isDigitalOnly ? 0 : 120
  const grandTotal = total + shipping

  const setQty = (id, qty) => setCart((c) => {
    const n = { ...c, [id]: Math.max(0, qty) }
    if (n[id] === 0) delete n[id]
    return n
  })

  function goToShipping() {
    if (items.length === 0) return toast(isAr ? 'أضف بطاقة أولًا' : 'Add a card first', 'error')
    if (isDigitalOnly) {
      placeOrder()
    } else {
      setStep('shipping')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  async function placeOrder() {
    if (!isDigitalOnly && (!form.name || !form.phone)) return toast(isAr ? 'أكمل بياناتك' : 'Complete your details', 'error')
    setPending(true)
    try {
      if (FIREBASE_READY) {
        await createOrder(user?.uid || 'guest', {
          items: items.map((x) => ({ id: x.product.id, name: isAr ? x.product.nameAr : x.product.nameEn, qty: x.qty, price: x.product.price })),
          total: grandTotal,
          currency: CURRENCY[lang],
          customer: { name: user?.displayName || form.name, email: user?.email || '', ...form },
          email: user?.email || '',
        })
      }
      setCart({})
      toast(isAr ? 'تم استلام طلبك ✓' : 'Order received ✓')
      nav('/onboarding')
    } catch {
      toast(isAr ? 'تعذر إتمام الطلب' : 'Could not place order', 'error')
    }
    setPending(false)
  }

  const stepIdx = STEPS.indexOf(step)

  return (
    <section className="section store-section">
      <div className="container">
        <div className="section-head">
          <span className="kicker">Lamsa</span>
          <h2>{text.store_title}</h2>
          <p>{text.store_subtitle}</p>
        </div>

        {/* Progress steps */}
        {step !== 'done' && items.length > 0 && (
          <div className="checkout-progress">
            {[
              { n: 1, l: isAr ? 'السلة' : 'Cart' },
              { n: 2, l: isAr ? 'الشحن' : 'Shipping' },
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

        {step === 'done' ? (
          <div className="order-success">
            <div className="order-success-icon">🎉</div>
            <h3>{isAr ? 'تم استلام طلبك!' : 'Order received!'}</h3>
            <p>{isAr ? 'سنتواصل معك قريباً للدفع عند الاستلام.' : 'We will contact you shortly for cash on delivery.'}</p>
            <div className="order-success-actions">
              <Link to="/dashboard" className="btn btn-primary">{isAr ? 'لوحة التحكم' : 'Dashboard'}</Link>
              <Link to="/store" className="btn btn-ghost" onClick={() => setStep('cart')}>{isAr ? 'العودة للمتجر' : 'Back to store'}</Link>
            </div>
          </div>
        ) : items.length === 0 ? (
          <>
            <div className="store-grid">
              {PRODUCTS.map((p) => (
                <div className={`pcard${p.popular ? ' hot' : ''}`} key={p.id}>
                  {p.popular && <span className="pop">{isAr ? 'الأكثر مبيعًا' : 'Popular'}</span>}
                  {p.originalPrice && <span className="pcard-discount">-50%</span>}
                  <Link to={`/store/${p.id}`} className="pcard-visual" style={{ background: p.color }}><img src={`/img/${p.img}`} alt={p.nameEn} /></Link>
                  <div className="pcard-body">
                    <h3><Link to={`/store/${p.id}`}>{isAr ? p.nameAr : p.nameEn}</Link></h3>
                    <p className="pcard-material">{isAr ? p.materialAr : p.materialEn}</p>
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
                      <button className="btn btn-primary btn-block" onClick={() => setQty(p.id, 1)}>
                        <IconCreditCard /> {text.buy}
                      </button>
                      <Link to={`/store/${p.id}`} className="btn btn-ghost btn-block pcard-detail">
                        {isAr ? 'التفاصيل' : 'Details'}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="store-trust">
              <div className="trust-item"><IconZap /> {isAr ? 'إصدار رقمي فوري' : 'Instant digital issue'}</div>
              <div className="trust-item"><IconShield /> {isAr ? 'شحن آمن وسريع' : 'Fast, secure shipping'}</div>
              <div className="trust-item"><IconCheck /> {isAr ? 'ضمان سنة' : '1-year warranty'}</div>
            </div>
          </>
        ) : step === 'cart' ? (
          <div className="store-checkout">
            {/* Cart */}
            <div className="dash-card">
              <div className="dash-card-header">
                <h3>{isAr ? 'سلة الطلب' : 'Your cart'}</h3>
                <p>{items.length} {isAr ? 'منتج' : 'items'}</p>
              </div>
              {items.map((i) => (
                <div key={i.product.id} className="cart-item">
                  <div className="cart-item-img" style={{ background: i.product.color }}>
                    <img src={`/img/${i.product.img}`} alt={i.product.nameEn} />
                  </div>
                  <div className="cart-item-info">
                    <b>{isAr ? i.product.nameAr : i.product.nameEn}</b>
                    <small>{i.product.materialEn}</small>
                    <div className="cart-item-price">{i.product.price} {CURRENCY[lang]} × {i.qty}</div>
                  </div>
                  <div className="cart-item-qty">
                    <button className="qty-btn" onClick={() => setQty(i.product.id, i.qty - 1)}><IconMinus /></button>
                    <span className="qty-val">{i.qty}</span>
                    <button className="qty-btn" onClick={() => setQty(i.product.id, i.qty + 1)}><IconPlus /></button>
                  </div>
                </div>
              ))}
              <div className="cart-summary">
                <div className="cart-summary-row">
                  <span>{isAr ? 'المجموع الفرعي' : 'Subtotal'}</span>
                  <span>{total} {CURRENCY[lang]}</span>
                </div>
                <div className="cart-summary-row">
                  <span>{isAr ? 'الشحن' : 'Shipping'}</span>
                  <span>{isDigitalOnly ? (isAr ? 'مجاني — منتج رقمي' : 'Free — Digital product') : `${shipping} ${CURRENCY[lang]}`}</span>
                </div>
                <div className="cart-summary-row cart-total">
                  <span>{isAr ? 'الإجمالي' : 'Total'}</span>
                  <span>{grandTotal} {CURRENCY[lang]}</span>
                </div>
              </div>
              <button className="btn btn-primary btn-block btn-lg" onClick={goToShipping}>
                {isAr ? 'التالي' : 'Continue'} →
              </button>
            </div>
          </div>
        ) : (
          <div className="store-checkout">
            {/* Review */}
            <div className="dash-card">
              <div className="dash-card-header">
                <h3>{isAr ? 'مراجعة الطلب' : 'Order review'}</h3>
              </div>
              {items.map((i) => (
                <div key={i.product.id} className="cart-item" style={{ padding: '10px 0' }}>
                  <div className="cart-item-info">
                    <b>{isAr ? i.product.nameAr : i.product.nameEn}</b>
                    <small>{i.qty} × {i.product.price} {CURRENCY[lang]}</small>
                  </div>
                  <div className="money">{i.product.price * i.qty} {CURRENCY[lang]}</div>
                </div>
              ))}
              <div className="cart-summary">
                <div className="cart-summary-row">
                  <span>{isAr ? 'المجموع' : 'Subtotal'}</span>
                  <span>{total} {CURRENCY[lang]}</span>
                </div>
                <div className="cart-summary-row">
                  <span>{isAr ? 'الشحن' : 'Shipping'}</span>
                  <span>{isDigitalOnly ? (isAr ? 'مجاني — منتج رقمي' : 'Free — Digital product') : `${shipping} ${CURRENCY[lang]}`}</span>
                </div>
                <div className="cart-summary-row cart-total">
                  <span>{isAr ? 'الإجمالي' : 'Total'}</span>
                  <span>{grandTotal} {CURRENCY[lang]}</span>
                </div>
              </div>
            </div>

            {/* Shipping form */}
            <div className="dash-card">
              <div className="dash-card-header">
                <h3>{isAr ? 'بيانات الشحن' : 'Shipping details'}</h3>
              </div>
              <div className="field"><label>{isAr ? 'الاسم' : 'Name'}</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="form-row">
                <div className="field"><label>{isAr ? 'الهاتف' : 'Phone'}</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div className="field"><label>{isAr ? 'البريد الإلكتروني' : 'Email'} <small>({isAr ? 'لإرسال الإيصال' : 'for receipt'})</small></label><input type="email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@email.com" dir="ltr" style={{ textAlign: 'left' }} /></div>
              </div>
              <div className="form-row">
                <div className="field"><label>{isAr ? 'المدينة' : 'City'}</label><input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
                <div className="field"><label>{isAr ? 'العنوان' : 'Address'}</label><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
              </div>
              <div className="field"><label>{isAr ? 'ملاحظات' : 'Notes'}</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>

              <div className="checkout-actions">
                <button className="btn btn-ghost" onClick={() => setStep('cart')}>← {isAr ? 'العودة' : 'Back'}</button>
                <button className="btn btn-primary btn-lg" onClick={placeOrder} disabled={pending}>
                  <IconCheck /> {pending ? '…' : (isAr ? 'إتمام الطلب' : 'Place order')}
                </button>
              </div>
              {!user && <p className="auth-switch" style={{ marginTop: 12 }}>{isAr ? 'يمكنك إتمام الشراء كزائر، أو سجّل لحفظ طلبك.' : 'Order as guest, or sign in to save it.'}</p>}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
