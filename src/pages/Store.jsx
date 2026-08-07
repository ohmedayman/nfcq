import { useState } from 'react'
import { useLang } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { PRODUCTS, CURRENCY } from '../data/content'
import { createOrder } from '../lib/firebase'
import { toast } from '../components/Toast'
import { NfcIcon, IconCreditCard, IconZap, IconShield, IconPlus, IconMinus, IconUser, IconMail, IconPhone, IconCheck } from '../components/icons'

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
    <section className="section">
      <div className="container">
        <div className="section-head">
          <span className="kicker">Lamsa</span>
          <h2>{text.store_title}</h2>
          <p>{text.store_subtitle}</p>
        </div>

        {done ? <OrderSummaryForm isAr={isAr} /> : items.length === 0 ? (
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
            <div style={{ textAlign: 'center', marginTop: 40, color: 'var(--muted)' }}>
              <span style={{ display: 'inline-flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}><IconZap /> {isAr ? 'إصدار رقمي فوري' : 'Instant digital issue'}</span>
                <span>·</span>
                <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}><IconShield /> {isAr ? 'شحن آمن وسريع' : 'Fast, secure shipping'}</span>
              </span>
            </div>
          </>
        ) : (
          <div style={{ maxWidth: 620, margin: '0 auto', display: 'grid', gap: 18 }}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: 22 }}>
              <h3 style={{ marginBottom: 16, fontWeight: 800 }}>{isAr ? 'سلة الطلب' : 'Your cart'}</h3>
              {items.map((i) => (
                <div key={i.product.id} className="link-row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <b>{isAr ? i.product.nameAr : i.product.nameEn}</b>
                    <small style={{ display: 'block', color: 'var(--muted)' }}>{i.product.price} {CURRENCY[lang]} × {i.qty}</small>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <QtyBtn onClick={() => setQty(i.product.id, i.qty - 1)}><IconMinus /></QtyBtn>
                    <b>{i.qty}</b>
                    <QtyBtn onClick={() => setQty(i.product.id, i.qty + 1)}><IconPlus /></QtyBtn>
                  </div>
                </div>
              ))}
              <div style={{ borderTop: '1px solid var(--line)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: 900 }}>
                <span>{isAr ? 'الإجمالي' : 'Total'}</span><span>{total} {CURRENCY[lang]}</span>
              </div>
            </div>

            <div className="panel">
              <h3>{isAr ? 'بيانات الدفع والشحن' : 'Billing & shipping'}</h3>
              <div className="field"><label>{isAr ? 'الاسم' : 'Name'}</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="field"><label>{isAr ? 'الهاتف' : 'Phone'}</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div className="field"><label>{isAr ? 'العنوان' : 'Address'}</label><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
              <button className="btn btn-primary btn-block" onClick={placeOrder} disabled={pending}>
                <IconCheck /> {pending ? '…' : (isAr ? 'إتمام الطلب والدفع عند الاستلام' : 'Place order')}
              </button>
              {!user && <p className="auth-switch" style={{ marginTop: 12 }}>{isAr ? 'يمكنك إتمام الشراء كزائر، أو سجّل لحفظ طلبك.' : 'Order as guest, or sign in to save it.'}</p>}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function QtyBtn({ children, onClick }) {
  return <button onClick={onClick} style={{ width: 34, height: 34, borderRadius: 9, border: '1px solid var(--line)', display: 'grid', placeItems: 'center', color: 'var(--ice)' }}>{children}</button>
}

function OrderSummaryForm({ isAr }) {
  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: 40, textAlign: 'center', background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 'var(--radius)' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
      <h3 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: 8 }}>{isAr ? 'جاري تجهيز طلبك!' : "Order confirmed!"}</h3>
      <p style={{ color: 'var(--muted)' }}>{isAr ? 'سنتواصل معك للدفع عند الاستلام عبر الهاتف.' : 'We will contact you for cash-on-delivery.'}</p>
    </div>
  )
}