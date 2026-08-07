import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { listOrders, updateOrderStatus, listProfiles, listProducts, setProductActive } from '../lib/firebase'
import { PRODUCTS } from '../data/content'
import { toast } from '../components/Toast'
import {
  IconZap, IconStore, IconUser, IconCreditCard, IconShield, IconRefresh, IconHome,
} from '../components/icons'

const STATUSES = ['pending', 'processing', 'shipped', 'done', 'cancelled']

export default function Admin() {
  const { user, isAdmin, loading } = useAuth()
  const { lang } = useLang()
  const isAr = lang === 'ar'
  const nav = useNavigate()

  const [tab, setTab] = useState('overview')
  const [orders, setOrders] = useState([])
  const [profiles, setProfiles] = useState([])
  const [products, setProducts] = useState(PRODUCTS)
  const [boot, setBoot] = useState(true)

  const cur = isAr ? 'ج.م' : 'EGP'

  useEffect(() => {
    if (loading) return
    if (!user) { nav('/account'); return }
    if (!isAdmin) { toast(isAr ? 'ليس لديك صلاحية المدير' : 'Owner access only', 'error'); nav('/'); return }
    loadAll()
  }, [user, loading, isAdmin])

  async function loadAll() {
    setBoot(true)
    try {
      const [o, p, pr] = await Promise.all([listOrders(), listProfiles(), listProducts()])
      setOrders(o)
      setProfiles(p)
      if (pr && pr.length) setProducts(pr)
    } catch { /* offline/oops */ }
    setBoot(false)
  }

  async function setStatus(id, val) {
    await updateOrderStatus(id, val)
    setOrders((o) => o.map((x) => (x.id === id ? { ...x, status: val } : x)))
    toast(isAr ? 'تم تحديث حالة الطلب ✓' : 'Order status updated ✓')
  }

  async function toggleProduct(id, on) {
    await setProductActive(id, on)
    setProducts((p) => p.map((x) => (x.id === id ? { ...x, active: on } : x)))
    toast(on ? (isAr ? 'تم تنشيط المنتج' : 'Enabled') : isAr ? 'تم إيقاف المنتج' : 'Disabled')
  }

  if (loading) return <Centered t={isAr ? 'جاري التحميل…' : 'Loading…'} />
  if (!user || !isAdmin) return <Centered t={isAr ? 'هذه الصفحة للمشرفين فقط' : 'Admin access only'} />

  const revenue = orders.reduce((s, o) => s + Number(o.total || 0), 0)
  const pending = orders.filter((o) => o.status === 'pending').length
  const productCount = products.filter((p) => p.active !== false).length

  const i18n = (s) => ({ pending: isAr ? 'قيد الانتظار' : 'Pending', processing: isAr ? 'قيد المعالجة' : 'Processing', shipped: isAr ? 'تم الشحن' : 'Shipped', done: isAr ? 'مكتمل' : 'Completed', cancelled: isAr ? 'ملغي' : 'Cancelled' }[s] || s)

  const tabs = [
    { id: 'overview', icon: <IconZap />, label: isAr ? 'نظرة عامة' : 'Overview' },
    { id: 'orders', icon: <IconStore />, label: isAr ? 'الطلبات' : 'Orders', badge: orders.length },
    { id: 'users', icon: <IconUser />, label: isAr ? 'المستخدمون' : 'Users', badge: profiles.length },
    { id: 'products', icon: <IconCreditCard />, label: isAr ? 'المنتجات' : 'Products' },
  ]

  return (
    <section className="section dash-section">
      <div className="container">
        <div className="dash-header">
          <div>
            <h2 className="dash-title"><IconShield /> {isAr ? 'لوحة الإدارة' : 'Admin Panel'}</h2>
            <p className="dash-sub">{isAr ? 'إدارة الطلبات والمستخدمين والمنتجات' : 'Manage orders, users, and products'}</p>
          </div>
        </div>

        <div className="dash-tabs">
          {tabs.map((t) => (
            <button key={t.id} className={`dash-tab ${tab === t.id ? 'on' : ''}`} onClick={() => setTab(t.id)}>
              {t.icon} <span>{t.label}</span>
              {t.badge != null && <span className="tab-badge">{t.badge}</span>}
            </button>
          ))}
        </div>

        <div className="dash-content" style={{ gridTemplateColumns: '1fr' }}>
          <div className="dash-main">
            {boot ? <Centered t={isAr ? 'جاري تحميل البيانات…' : 'Loading data…'} />
              : tab === 'overview' ? <Overview orders={orders} total={revenue} pending={pending} users={profiles.length} cur={cur} isAr={isAr} />
              : tab === 'orders' ? <Orders orders={orders} change={setStatus} i18n={i18n} cur={cur} isAr={isAr} />
              : tab === 'users' ? <Users profiles={profiles} isAr={isAr} />
              : <ProductsPanel products={products} toggle={toggleProduct} isAr={isAr} />}
          </div>
        </div>
      </div>
    </section>
  )
}

function Centered({ t }) {
  return <section className="section"><div className="container" style={{ textAlign: 'center', color: 'var(--muted)' }}>{t}</div></section>
}

function Overview({ orders, total, pending, users, cur, isAr }) {
  const recent = orders.slice(0, 6)
  return (
    <div>
      <div className="admin-stats">
        <div className="stat-card"><div className="stat-card-icon" style={{ background: 'rgba(24,84,232,0.1)', color: 'var(--cobalt)' }}>💰</div><div className="num">{currency(total)}</div><div className="lbl">{cur}</div></div>
        <div className="stat-card"><div className="stat-card-icon" style={{ background: 'rgba(21,216,242,0.1)', color: 'var(--cyan)' }}>📦</div><div className="num">{orders.length}</div><div className="lbl">{isAr ? 'الطلبات' : 'Orders'}</div></div>
        <div className="stat-card"><div className="stat-card-icon" style={{ background: 'rgba(255,209,102,0.12)', color: '#d4a017' }}>⏳</div><div className="num">{pending}</div><div className="lbl">{isAr ? 'قيد الانتظار' : 'Pending'}</div></div>
        <div className="stat-card"><div className="stat-card-icon" style={{ background: 'rgba(76,217,100,0.1)', color: '#2ea043' }}>👥</div><div className="num">{users}</div><div className="lbl">{isAr ? 'المستخدمون' : 'Users'}</div></div>
      </div>
      <div className="dash-card">
        <div className="dash-card-header">
          <h3>{isAr ? 'أحدث الطلبات' : 'Recent orders'}</h3>
        </div>
        {recent.length === 0 ? <div className="empty">{isAr ? 'لا طلبات بعد.' : 'No orders yet.'}</div> : (
          <div className="admin-table">
            <table>
              <thead><tr><th>{isAr ? 'الطلب' : 'Order'}</th><th>{isAr ? 'العميل' : 'Customer'}</th><th>{isAr ? 'الإجمالي' : 'Total'}</th><th>{isAr ? 'الحالة' : 'Status'}</th></tr></thead>
              <tbody>
                {recent.map((o) => (
                  <tr key={o.id}>
                    <td className="mono">#{o.id.slice(0, 6)}</td>
                    <td>{o.customer?.name || o.uid || '—'}</td>
                    <td className="money">{currency(o.total)}</td>
                    <td><StatusBadge s={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function Orders({ orders, change, i18n, cur, isAr }) {
  const [open, setOpen] = useState(null)
  return (
    <div>
      <div className="dash-card">
        <div className="dash-card-header">
          <h3>{isAr ? 'الطلبات' : 'Orders'} <span style={{ fontSize: '0.9rem', color: 'var(--muted)', fontWeight: 600 }}>({orders.length})</span></h3>
        </div>
        {orders.length === 0 ? <div className="empty">{isAr ? 'لا توجد طلبات.' : 'No orders.'}</div> : (
          <div className="admin-table">
            <table>
              <thead><tr><th>#</th><th>{isAr ? 'العميل' : 'Customer'}</th><th>{isAr ? 'المنتجات' : 'Items'}</th><th>{isAr ? 'الإجمالي' : 'Total'}</th><th>{isAr ? 'الحالة' : 'Status'}</th><th></th></tr></thead>
              <tbody>
                {orders.map((o) => (
                  <OrderRow key={o.id} o={o} open={open === o.id} onToggle={() => setOpen(open === o.id ? null : o.id)} change={change} i18n={i18n} cur={cur} isAr={isAr} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function OrderRow({ o, open, onToggle, change, i18n, cur, isAr }) {
  return (
    <>
      <tr>
        <td className="mono">#{o.id.slice(0, 8)}</td>
        <td>
          <b>{o.customer?.name || '—'}</b>
          <div className="mono" style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{o.customer?.phone} · {o.email}</div>
        </td>
        <td>{(o.items || []).map((i) => `${i.name} ×${i.qty}`).join(', ') || '—'}</td>
        <td className="money">{currency(o.total)} {cur}</td>
        <td>
          <select className="status-select" value={o.status || 'pending'} onChange={(e) => change(o.id, e.target.value)}>
            {STATUSES.map((s) => <option key={s} value={s}>{i18n(s)}</option>)}
          </select>
        </td>
        <td><button className="btn btn-ghost btn-sm" onClick={onToggle}>{open ? (isAr ? 'إغلاق' : 'Close') : (isAr ? 'تفاصيل' : 'Details')}</button></td>
      </tr>
      {open && (
        <tr>
          <td colSpan={6} style={{ background: 'rgba(12,24,48,0.02)' }}>
            <div style={{ padding: '12px 0', display: 'grid', gap: 8, fontSize: '0.9rem' }}>
              <div><b>{isAr ? 'العنوان' : 'Address'}:</b> {o.customer?.address || '—'}</div>
              <div><b>UID:</b> <span className="mono">{o.uid}</span></div>
              <div><b>{isAr ? 'التاريخ' : 'Date'}:</b> {o.createdAt ? new Date(o.createdAt).toLocaleString() : '—'}</div>
              {(o.items || []).length > 0 && <div style={{ marginTop: 4 }}><b>{isAr ? 'التفاصيل' : 'Items'}:</b></div>}
              {(o.items || []).map((it, i) => (
                <div key={i} style={{ paddingLeft: 18, color: 'var(--muted)' }}>· {it.name} — {it.qty} × {it.price} {cur} = <b className="money">{it.qty * it.price}</b></div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

function Users({ profiles, isAr }) {
  return (
    <div className="dash-card">
      <div className="dash-card-header">
        <h3>{isAr ? 'المستخدمون' : 'Users'} <span style={{ fontSize: '0.9rem', color: 'var(--muted)', fontWeight: 600 }}>({profiles.length})</span></h3>
      </div>
      {profiles.length === 0 ? <div className="empty"><div className="big">👥</div>{isAr ? 'لا مستخدمين بعد.' : 'No users yet.'}</div> : (
        <div className="admin-table">
          <table>
            <thead><tr><th>{isAr ? 'الاسم' : 'Name'}</th><th>Email</th><th>UID</th><th>{isAr ? 'التاريخ' : 'Created'}</th></tr></thead>
            <tbody>
              {profiles.map((p) => (
                <tr key={p.id}>
                  <td><b>{p.name || '—'}</b></td>
                  <td>{p.email || '—'}</td>
                  <td className="mono">{p.uid || p.id}</td>
                  <td>{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function ProductsPanel({ products, toggle, isAr }) {
  return (
    <div>
      <div className="dash-card">
        <div className="dash-card-header">
          <h3>{isAr ? 'المنتجات' : 'Products'}</h3>
        </div>
        <div className="store-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {products.map((p) => (
            <div className={`pcard${p.popular ? ' hot' : ''}`} key={p.id}>
              <div className="pcard-visual"><img src={`/img/${p.img}`} alt={p.nameEn} /></div>
              <div className="pcard-body">
                <h3>{isAr ? p.nameAr : p.nameEn}</h3>
                <p className="price"><b>{p.price}</b><small>{isAr ? 'ج.م' : 'EGP'}</small></p>
                <button className={`btn ${p.active === false ? 'btn-ghost' : 'btn-primary'} btn-block`} onClick={() => toggle(p.id, p.active !== false ? false : true)}>
                  {p.active === false ? (isAr ? 'إعادة تنشيط' : 'Reactivate') : (isAr ? 'إيقاف' : 'Disable')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ s }) {
  return <span className={`status ${s || 'pending'}`}>{s || 'pending'}</span>
}

function currency(amount) {
  const n = Number(amount || 0)
  return n.toLocaleString('en-EG')
}
