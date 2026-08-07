import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { PRODUCTS, CURRENCY } from '../data/content'
import { createOrder } from '../lib/firebase'
import { toast } from '../components/Toast'
import { NfcIcon, IconCreditCard, IconZap, IconShield, IconPlus, IconMinus, IconCheck } from '../components/icons'

export default function Store() {
  const { text, lang } = useLang()
  const isAr = lang === 'ar'
  const { user } = useAuth()
  const [cart, setCart] = useState({})
  const [pending, setPending] = useState(false)
  const [done, setDone] = useState(false)
  const [form, setForm] = useState({ name: user?.displayName || '', phone: '', address: '' })

  const items = PRODUCTS.map((p) => ({ product: p, qty: cart[p.id] || 0 })).filter((x) => x.qty > 0)
  const total = items.reduce((s, x) => s + x.product.price * x.qty, 0)

  const setQty = (id, qty) => setCart((c) => {
    const n = { ...c, [id]: Math.max(0, qty) }
    if (n[id] === 0) delete n[id]
    return n
  })

  async function placeOrder() {
    if (items.length === 0) return toast(isAr ? 'أضف بطاقة أولًا' : 'Add a card first', 'error')
    if (!form.name || !form.phone) return toast(isAr ? 'أكمل بياناتك' : 'Complete your details', 'error')
    setPending(true)
    try {
      await createOrder(user?.uid || 'guest', {
        items: items.map((x) => ({ id: x.product.id, name: isAr ? x.product.nameAr : x.product.nameEn, qty: x.qty, price: x.product.price })),
        total,
        currency: CURRENCY[lang],
        customer: form,
        email: user?.email || '',
      })
      setCart({})
      setDone(true)
      toast(isAr ? 'تم استلام طلبك ✓' : 'Order received ✓')
    } catch {
      toast(isAr ? 'تعذر إتمام الطلب' : 'Could not place order', 'error')
    }
    setPending(false)
  }

  return (
    <section className="section store-section">
      <div className="container">
        <div className="section-head">
          <span className="kicker">Lamsa</span>
          <h2>{text.store_title}</h2>
          <p>{text.store_subtitle}</p>
        </div>

        {done ? (
          <div className="order-success">
            <div className="order-success-icon">🎉</div>
            <h3>{isAr ? 'تم استلام طلبك!' : 'Order received!'}</h3>
            <p>{isAr ? 'سنتواصل معك قريباً للدفع عند الاستلام.' : 'We will contact you shortly for cash on delivery.'}</p>
            <Link to="/dashboard" className="btn btn-primary">{isAr ? 'لوحة التحكم' : 'Dashboard'}</Link>
          </div>
        ) : items.length === 0 ? (
          <>
            <div className="store-grid">
              {PRODUCTS.map((p) => (
                <div className={`pcard${p.popular ? ' hot' : ''}`} key={p.id}>
                  {p.popular && <span className="pop">{isAr ? 'الأكثر مبيعًا' : 'Popular'}</span>}
                  <div className="pcard-visual"><img src={`/img/${p.img}`} alt={p.nameEn} /></div>
                  <div className="pcard-body">
                    <h3>{isAr ? p.nameAr : p.nameEn}</h3>
                    <p className="pcard-material">{isAr ? p.materialAr : p.materialEn}</p>
                    <ul className="specs">
                      {(isAr ? p.specs.ar : p.specs.en).map((s, i) => (
                        <li key={i}><span className="i">✓</span>{s}</li>
                      ))}
                    </ul>
                    <div className="price"><b>{p.price}</b><small>{CURRENCY[lang]}</small></div>
                    <button className="btn btn-primary btn-block" onClick={() => setQty(p.id, 1)}>
                      <IconCreditCard /> {text.buy}
                    </button>
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
        ) : (
          <div className="store-checkout">
            {/* Cart */}
            <div className="dash-card">
              <div className="dash-card-header">
                <h3>{isAr ? 'سلة الطلب' : 'Your cart'}</h3>
                <p>{items.length} {isAr ? 'منتج' : 'items'}</p>
              </div>
              {items.map((i) => (
                <div key={i.product.id} className="cart-item">
                  <div className="cart-item-info">
                    <b>{isAr ? i.product.nameAr : i.product.nameEn}</b>
                    <small>{i.product.price} {CURRENCY[lang]} × {i.qty}</small>
                  </div>
                  <div className="cart-item-qty">
                    <button className="qty-btn" onClick={() => setQty(i.product.id, i.qty - 1)}><IconMinus /></button>
                    <span className="qty-val">{i.qty}</span>
                    <button className="qty-btn" onClick={() => setQty(i.product.id, i.qty + 1)}><IconPlus /></button>
                  </div>
                </div>
              ))}
              <div className="cart-total">
                <span>{isAr ? 'الإجمالي' : 'Total'}</span>
                <span>{total} {CURRENCY[lang]}</span>
              </div>
            </div>

            {/* Checkout form */}
            <div className="dash-card">
              <div className="dash-card-header">
                <h3>{isAr ? 'بيانات الشحن' : 'Shipping details'}</h3>
              </div>
              <div className="field"><label>{isAr ? 'الاسم' : 'Name'}</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="field"><label>{isAr ? 'الهاتف' : 'Phone'}</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div className="field"><label>{isAr ? 'العنوان' : 'Address'}</label><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
              <button className="btn btn-primary btn-block" onClick={placeOrder} disabled={pending}>
                <IconCheck /> {pending ? '…' : (isAr ? 'إتمام الطلب' : 'Place order')}
              </button>
              {!user && <p className="auth-switch" style={{ marginTop: 12 }}>{isAr ? 'يمكنك إتمام الشراء كزائر، أو سجّل لحفظ طلبك.' : 'Order as guest, or sign in to save it.'}</p>}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
