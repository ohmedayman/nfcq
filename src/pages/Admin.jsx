import { useState, useEffect, useMemo } from 'react'
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
const TIME_FILTERS = ['today', 'week', 'month', 'all']

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
  const [timeFilter, setTimeFilter] = useState('all')

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

  const filteredOrders = useMemo(() => {
    const now = Date.now()
    return orders.filter((o) => {
      if (timeFilter === 'all') return true
      const t = o.createdAt ? new Date(o.createdAt).getTime() : 0
      if (timeFilter === 'today') return now - t < 86400000
      if (timeFilter === 'week') return now - t < 604800000
      if (timeFilter === 'month') return now - t < 2592000000
      return true
    })
  }, [orders, timeFilter])

  const revenue = filteredOrders.reduce((s, o) => s + Number(o.total || 0), 0)
  const pending = filteredOrders.filter((o) => o.status === 'pending').length
  const completed = filteredOrders.filter((o) => o.status === 'done').length
  const productCount = products.filter((p) => p.active !== false).length

  const tabs = [
    { id: 'overview', icon: <IconZap />, label: isAr ? 'نظرة عامة' : 'Overview' },
    { id: 'orders', icon: <IconStore />, label: isAr ? 'الطلبات' : 'Orders', badge: filteredOrders.length },
    { id: 'users', icon: <IconUser />, label: isAr ? 'المستخدمون' : 'Users', badge: profiles.length },
    { id: 'products', icon: <IconCreditCard />, label: isAr ? 'المنتجات' : 'Products' },
  ]

  const i18n = (s) => ({
    pending: isAr ? 'قيد الانتظار' : 'Pending',
    processing: isAr ? 'قيد المعالجة' : 'Processing',
    shipped: isAr ? 'تم الشحن' : 'Shipped',
    done: isAr ? 'مكتمل' : 'Completed',
    cancelled: isAr ? 'ملغي' : 'Cancelled',
  }[s] || s)

  return (
    <section className="section dash-section">
      <div className="container">
        <div className="dash-header">
          <div>
            <h2 className="dash-title"><IconShield /> {isAr ? 'لوحة الإدارة' : 'Admin Panel'}</h2>
            <p className="dash-sub">{isAr ? 'إدارة الطلبات والمستخدمين والمنتجات' : 'Manage orders, users, and products'}</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={loadAll}>
            <IconRefresh /> {isAr ? 'تحديث' : 'Refresh'}
          </button>
        </div>

        {/* Time filter */}
        <div className="admin-time-filter">
          {TIME_FILTERS.map((f) => (
            <button key={f} className={`admin-time-btn ${timeFilter === f ? 'on' : ''}`} onClick={() => setTimeFilter(f)}>
              {f === 'today' ? (isAr ? 'اليوم' : 'Today') : f === 'week' ? (isAr ? 'هذا الأسبوع' : 'This Week') : f === 'month' ? (isAr ? 'هذا الشهر' : 'This Month') : (isAr ? 'الكل' : 'All Time')}
            </button>
          ))}
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
              : tab === 'overview' ? <Overview orders={filteredOrders} total={revenue} pending={pending} completed={completed} users={profiles.length} productCount={productCount} cur={cur} isAr={isAr} />
              : tab === 'orders' ? <Orders orders={filteredOrders} change={setStatus} i18n={i18n} cur={cur} isAr={isAr} />
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

function Overview({ orders, total, pending, completed, users, productCount, cur, isAr }) {
  const recent = orders.slice(0, 5)
  const cancelled = orders.filter((o) => o.status === 'cancelled').length

  // Build simple bar chart data
  const barData = useMemo(() => {
    const days = 7
    const now = Date.now()
    return Array.from({ length: days }, (_, i) => {
      const dayStart = now - (days - i) * 86400000
      const dayEnd = dayStart + 86400000
      const dayOrders = orders.filter((o) => {
        const t = o.createdAt ? new Date(o.createdAt).getTime() : 0
        return t >= dayStart && t < dayEnd
      })
      const dayRevenue = dayOrders.reduce((s, o) => s + Number(o.total || 0), 0)
      return {
        label: new Date(dayStart).toLocaleDateString(isAr ? 'ar' : 'en', { weekday: 'short' }),
        count: dayOrders.length,
        revenue: dayRevenue,
      }
    })
  }, [orders, isAr])

  const maxRevenue = Math.max(...barData.map((d) => d.revenue), 1)

  return (
    <div>
      <div className="admin-stats">
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(24,84,232,0.1)', color: 'var(--cobalt)' }}>💰</div>
          <div className="num">{currency(total)}</div>
          <div className="lbl">{cur} {isAr ? 'إجمالي الإيرادات' : 'Total Revenue'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(21,216,242,0.1)', color: 'var(--cyan)' }}>📦</div>
          <div className="num">{orders.length}</div>
          <div className="lbl">{isAr ? 'الطلبات' : 'Orders'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(255,209,102,0.12)', color: '#d4a017' }}>⏳</div>
          <div className="num">{pending}</div>
          <div className="lbl">{isAr ? 'قيد الانتظار' : 'Pending'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(76,217,100,0.1)', color: '#2ea043' }}>✅</div>
          <div className="num">{completed}</div>
          <div className="lbl">{isAr ? 'مكتمل' : 'Completed'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(124,58,237,0.1)', color: '#7c3aed' }}>👥</div>
          <div className="num">{users}</div>
          <div className="lbl">{isAr ? 'المستخدمون' : 'Users'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(236,72,153,0.1)', color: '#ec4899' }}>🏷️</div>
          <div className="num">{productCount}</div>
          <div className="lbl">{isAr ? 'المنتجات' : 'Products'}</div>
        </div>
      </div>

      {/* Revenue chart */}
      <div className="dash-card">
        <div className="dash-card-header">
          <h3>{isAr ? 'الإيرادات هذا الأسبوع' : 'Revenue this week'}</h3>
        </div>
        <div className="admin-chart">
          {barData.map((d, i) => (
            <div key={i} className="admin-bar-col">
              <div className="admin-bar-val">{d.revenue > 0 ? currency(d.revenue) : ''}</div>
              <div className="admin-bar-track">
                <div className="admin-bar" style={{ height: `${(d.revenue / maxRevenue) * 100}%` }} />
              </div>
              <div className="admin-bar-label">{d.label}</div>
              <div className="admin-bar-count">{d.count} {isAr ? 'طلب' : 'orders'}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent orders + Quick stats */}
      <div className="admin-grid-2">
        <div className="dash-card">
          <div className="dash-card-header">
            <h3>{isAr ? 'أحدث الطلبات' : 'Recent orders'}</h3>
          </div>
          {recent.length === 0 ? (
            <div className="empty">{isAr ? 'لا طلبات بعد.' : 'No orders yet.'}</div>
          ) : (
            <div className="admin-list">
              {recent.map((o) => (
                <div key={o.id} className="admin-list-item">
                  <div className="admin-list-left">
                    <div className="admin-list-avatar">{(o.customer?.name || '?').charAt(0).toUpperCase()}</div>
                    <div>
                      <div className="admin-list-name">{o.customer?.name || '—'}</div>
                      <div className="admin-list-sub">#{o.id.slice(0, 6)}</div>
                    </div>
                  </div>
                  <div className="admin-list-right">
                    <div className="admin-list-amount">{currency(o.total)} {cur}</div>
                    <StatusBadge s={o.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dash-card">
          <div className="dash-card-header">
            <h3>{isAr ? 'ملخص سريع' : 'Quick summary'}</h3>
          </div>
          <div className="admin-summary">
            <div className="admin-summary-row">
              <span>{isAr ? 'معدل الإتمام' : 'Completion rate'}</span>
              <span className="admin-summary-val">{orders.length > 0 ? Math.round((completed / orders.length) * 100) : 0}%</span>
            </div>
            <div className="admin-summary-row">
              <span>{isAr ? 'معدل الإلغاء' : 'Cancellation rate'}</span>
              <span className="admin-summary-val">{orders.length > 0 ? Math.round((cancelled / orders.length) * 100) : 0}%</span>
            </div>
            <div className="admin-summary-row">
              <span>{isAr ? 'متوسط الطلب' : 'Average order'}</span>
              <span className="admin-summary-val">{orders.length > 0 ? currency(total / orders.length) : 0} {cur}</span>
            </div>
            <div className="admin-summary-row">
              <span>{isAr ? 'المنتجات النشطة' : 'Active products'}</span>
              <span className="admin-summary-val">{productCount}</span>
            </div>
            <div className="admin-summary-row">
              <span>{isAr ? 'إجمالي المستخدمين' : 'Total users'}</span>
              <span className="admin-summary-val">{users}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Orders({ orders, change, i18n, cur, isAr }) {
  const [open, setOpen] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return orders
    return orders.filter((o) => o.status === statusFilter)
  }, [orders, statusFilter])

  return (
    <div>
      <div className="dash-card">
        <div className="dash-card-header">
          <h3>{isAr ? 'الطلبات' : 'Orders'} <span style={{ fontSize: '0.9rem', color: 'var(--muted)', fontWeight: 600 }}>({filtered.length})</span></h3>
          <div className="admin-filter-pills">
            <button className={`admin-pill ${statusFilter === 'all' ? 'on' : ''}`} onClick={() => setStatusFilter('all')}>{isAr ? 'الكل' : 'All'}</button>
            {STATUSES.map((s) => (
              <button key={s} className={`admin-pill ${statusFilter === s ? 'on' : ''}`} onClick={() => setStatusFilter(s)}>{i18n(s)}</button>
            ))}
          </div>
        </div>
        {filtered.length === 0 ? <div className="empty">{isAr ? 'لا توجد طلبات.' : 'No orders.'}</div> : (
          <div className="admin-table">
            <table>
              <thead><tr><th>#</th><th>{isAr ? 'العميل' : 'Customer'}</th><th>{isAr ? 'المنتجات' : 'Items'}</th><th>{isAr ? 'الإجمالي' : 'Total'}</th><th>{isAr ? 'التاريخ' : 'Date'}</th><th>{isAr ? 'الحالة' : 'Status'}</th><th></th></tr></thead>
              <tbody>
                {filtered.map((o) => (
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
  const date = o.createdAt ? new Date(o.createdAt).toLocaleDateString(isAr ? 'ar' : 'en', { month: 'short', day: 'numeric' }) : '—'
  return (
    <>
      <tr>
        <td className="mono">#{o.id.slice(0, 8)}</td>
        <td>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="admin-list-avatar" style={{ width: 32, height: 32, fontSize: '0.75rem' }}>{(o.customer?.name || '?').charAt(0).toUpperCase()}</div>
            <div>
              <b>{o.customer?.name || '—'}</b>
              <div className="mono" style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{o.customer?.phone} · {o.email}</div>
            </div>
          </div>
        </td>
        <td>{(o.items || []).map((i) => `${i.name} ×${i.qty}`).join(', ') || '—'}</td>
        <td className="money">{currency(o.total)} {cur}</td>
        <td style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>{date}</td>
        <td>
          <select className="status-select" value={o.status || 'pending'} onChange={(e) => change(o.id, e.target.value)}>
            {STATUSES.map((s) => <option key={s} value={s}>{i18n(s)}</option>)}
          </select>
        </td>
        <td><button className="btn btn-ghost btn-sm" onClick={onToggle}>{open ? (isAr ? 'إغلاق' : 'Close') : (isAr ? 'تفاصيل' : 'Details')}</button></td>
      </tr>
      {open && (
        <tr>
          <td colSpan={7} style={{ background: 'rgba(12,24,48,0.02)' }}>
            <div style={{ padding: '16px 0', display: 'grid', gap: 10, fontSize: '0.9rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><b>{isAr ? 'العنوان' : 'Address'}:</b> <span style={{ color: 'var(--muted)' }}>{o.customer?.address || '—'}</span></div>
                <div><b>UID:</b> <span className="mono" style={{ color: 'var(--muted)' }}>{o.uid}</span></div>
                <div><b>{isAr ? 'التاريخ' : 'Date'}:</b> <span style={{ color: 'var(--muted)' }}>{o.createdAt ? new Date(o.createdAt).toLocaleString() : '—'}</span></div>
                <div><b>{isAr ? 'الحالة' : 'Status'}:</b> <StatusBadge s={o.status} /></div>
              </div>
              {(o.items || []).length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <b>{isAr ? 'المنتجات' : 'Items'}:</b>
                  <div style={{ marginTop: 6, display: 'grid', gap: 4 }}>
                    {(o.items || []).map((it, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 12, color: 'var(--muted)', fontSize: '0.88rem' }}>
                        <span>· {it.name} × {it.qty}</span>
                        <b className="money">{currency(it.qty * it.price)} {cur}</b>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
        <div className="admin-list">
          {profiles.map((p) => (
            <div key={p.id} className="admin-list-item">
              <div className="admin-list-left">
                <div className="admin-list-avatar">{(p.name || '?').charAt(0).toUpperCase()}</div>
                <div>
                  <div className="admin-list-name">{p.name || '—'}</div>
                  <div className="admin-list-sub">{p.email || '—'}</div>
                </div>
              </div>
              <div className="admin-list-right">
                <div className="admin-list-sub">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}</div>
                <div className="admin-list-sub mono">{(p.uid || p.id || '').slice(0, 8)}</div>
              </div>
            </div>
          ))}
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
        <div className="admin-product-grid">
          {products.map((p) => (
            <div className={`admin-product-card ${p.active === false ? 'disabled' : ''}`} key={p.id}>
              <div className="admin-product-img" style={{ background: p.color }}>
                <img src={`/img/${p.img}`} alt={p.nameEn} />
                {p.popular && <span className="admin-product-badge">{isAr ? 'الأكثر مبيعًا' : 'Popular'}</span>}
                {p.active === false && <span className="admin-product-disabled">{isAr ? 'متوقف' : 'Disabled'}</span>}
              </div>
              <div className="admin-product-body">
                <h4>{isAr ? p.nameAr : p.nameEn}</h4>
                <div className="admin-product-price">{p.price} {isAr ? 'ج.م' : 'EGP'}</div>
                <div className="admin-product-actions">
                  <button className={`btn ${p.active === false ? 'btn-primary' : 'btn-ghost'} btn-sm btn-block`} onClick={() => toggle(p.id, p.active !== false ? false : true)}>
                    {p.active === false ? (isAr ? 'تفعيل' : 'Enable') : (isAr ? 'إيقاف' : 'Disable')}
                  </button>
                </div>
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
