import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { listOrders, updateOrderStatus, listProfiles, listProducts, setProductActive, upsertProduct } from '../lib/firebase'
import { PRODUCTS as STATIC_PRODUCTS } from '../data/content'
import { toast } from '../components/Toast'
import { IconRefresh } from '../components/icons'

const STATUSES = ['pending', 'processing', 'shipped', 'done', 'cancelled']
const TIME_FILTERS = ['today', 'week', 'month', 'all']

const STATUS_COLORS = {
  pending: { bg: '#fffbeb', text: '#b45309', dot: '#f59e0b' },
  processing: { bg: '#eff6ff', text: '#1d4ed8', dot: '#3b82f6' },
  shipped: { bg: '#f5f3ff', text: '#6d28d9', dot: '#8b5cf6' },
  done: { bg: '#ecfdf5', text: '#047857', dot: '#10b981' },
  cancelled: { bg: '#fef2f2', text: '#b91c1c', dot: '#ef4444' },
}

export default function Admin() {
  const { user, isAdmin, loading, logout } = useAuth()
  const { lang } = useLang()
  const isAr = lang === 'ar'
  const nav = useNavigate()

  const [tab, setTab] = useState('overview')
  const [orders, setOrders] = useState([])
  const [profiles, setProfiles] = useState([])
  const [products, setProducts] = useState(STATIC_PRODUCTS)
  const [boot, setBoot] = useState(true)
  const [timeFilter, setTimeFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

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

  async function saveProduct(productObj) {
    await upsertProduct(productObj.id, productObj)
    setProducts((p) => p.map((x) => (x.id === productObj.id ? productObj : x)))
    toast(isAr ? 'تم حفظ المنتج ✓' : 'Product saved ✓')
  }

  async function syncProductsToFirebase() {
    if (!window.confirm(isAr ? 'هل أنت متأكد من مزامنة المنتجات الأساسية؟' : 'Are you sure you want to sync default products?')) return
    for (const p of STATIC_PRODUCTS) {
      await upsertProduct(p.id, p)
    }
    loadAll()
    toast(isAr ? 'تمت المزامنة بنجاح ✓' : 'Sync completed ✓')
  }

  function exportOrders() {
    const headers = ['#', 'Customer', 'Phone', 'Email', 'Items', 'Total', 'Status', 'Date']
    const rows = filteredOrders.map((o, i) => [
      i + 1,
      o.customer?.name || '',
      o.customer?.phone || '',
      o.email || '',
      (o.items || []).map((x) => `${x.name} x${x.qty}`).join('; '),
      o.total || 0,
      o.status || 'pending',
      o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '',
    ])
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast(isAr ? 'تم تصدير الطلبات ✓' : 'Orders exported ✓')
  }

  if (loading) return <AdminLoading />
  if (!user || !isAdmin) return <AdminLoading />

  const filteredOrders = useMemo(() => {
    const now = Date.now()
    return orders.filter((o) => {
      if (timeFilter !== 'all') {
        const t = o.createdAt ? new Date(o.createdAt).getTime() : 0
        if (timeFilter === 'today' && now - t >= 86400000) return false
        if (timeFilter === 'week' && now - t >= 604800000) return false
        if (timeFilter === 'month' && now - t >= 2592000000) return false
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const matchName = (o.customer?.name || '').toLowerCase().includes(q)
        const matchPhone = (o.customer?.phone || '').includes(q)
        const matchEmail = (o.email || '').toLowerCase().includes(q)
        const matchId = (o.id || '').toLowerCase().includes(q)
        if (!matchName && !matchPhone && !matchEmail && !matchId) return false
      }
      return true
    })
  }, [orders, timeFilter, searchQuery])

  const revenue = filteredOrders.reduce((s, o) => s + Number(o.total || 0), 0)
  const pending = filteredOrders.filter((o) => o.status === 'pending').length
  const processing = filteredOrders.filter((o) => o.status === 'processing').length
  const shipped = filteredOrders.filter((o) => o.status === 'shipped').length
  const completed = filteredOrders.filter((o) => o.status === 'done').length
  const cancelled = filteredOrders.filter((o) => o.status === 'cancelled').length
  const productCount = products.filter((p) => p.active !== false).length

  const tabs = [
    { id: 'overview', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>, label: isAr ? 'نظرة عامة' : 'Overview' },
    { id: 'orders', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>, label: isAr ? 'الطلبات' : 'Orders', badge: filteredOrders.length },
    { id: 'users', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>, label: isAr ? 'المستخدمون' : 'Users', badge: profiles.length },
    { id: 'products', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>, label: isAr ? 'المنتجات' : 'Products' },
  ]

  const i18n = (s) => ({
    pending: isAr ? 'قيد الانتظار' : 'Pending',
    processing: isAr ? 'قيد المعالجة' : 'Processing',
    shipped: isAr ? 'تم الشحن' : 'Shipped',
    done: isAr ? 'مكتمل' : 'Completed',
    cancelled: isAr ? 'ملغي' : 'Cancelled',
  }[s] || s)

  return (
    <div className="adm">
      <aside className={`adm-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="adm-sidebar-header">
          <Link to="/" className="adm-logo">
            <div className="adm-logo-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            </div>
            <div className="adm-logo-text-wrap">
              <span className="adm-logo-text">Lamsa</span>
              <span className="adm-logo-sub">{isAr ? 'لوحة التحكم' : 'Admin Panel'}</span>
            </div>
          </Link>
          <button className="adm-sidebar-close" onClick={() => setSidebarOpen(false)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <nav className="adm-nav">
          <div className="adm-nav-section">{isAr ? 'القائمة الرئيسية' : 'Main Menu'}</div>
          {tabs.map((t) => (
            <button key={t.id} className={`adm-nav-item ${tab === t.id ? 'active' : ''}`} onClick={() => { setTab(t.id); setSidebarOpen(false) }}>
              <span className="adm-nav-icon">{t.icon}</span>
              <span className="adm-nav-label">{t.label}</span>
              {t.badge != null && <span className="adm-nav-badge">{t.badge}</span>}
            </button>
          ))}
          <div className="adm-nav-section" style={{ marginTop: 24 }}>{isAr ? 'روابط سريعة' : 'Quick Links'}</div>
          <Link to="/dashboard" className="adm-nav-item" onClick={() => setSidebarOpen(false)}>
            <span className="adm-nav-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></span>
            <span className="adm-nav-label">{isAr ? 'لوحة التحكم' : 'Dashboard'}</span>
          </Link>
          <Link to="/" className="adm-nav-item" onClick={() => setSidebarOpen(false)}>
            <span className="adm-nav-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg></span>
            <span className="adm-nav-label">{isAr ? 'الموقع' : 'Website'}</span>
          </Link>
        </nav>

        <div className="adm-sidebar-footer">
          <div className="adm-user-info">
            <div className="adm-user-avatar">
              {(user?.email || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="adm-user-meta">
              <div className="adm-user-name">{isAr ? 'المدير' : 'Admin'}</div>
              <div className="adm-user-email">{user?.email || ''}</div>
            </div>
          </div>
          <button className="adm-logout-btn" onClick={() => { logout(); nav('/') }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            <span>{isAr ? 'تسجيل الخروج' : 'Sign Out'}</span>
          </button>
        </div>
      </aside>

      <main className="adm-main">
        <header className="adm-topbar">
          <button className="adm-hamburger" onClick={() => setSidebarOpen(true)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <div className="adm-topbar-left">
            <h1 className="adm-page-title">{tabs.find(t => t.id === tab)?.label}</h1>
          </div>
          <div className="adm-topbar-right">
            <button className="adm-topbar-btn" onClick={loadAll}>
              <IconRefresh /> {isAr ? 'تحديث' : 'Refresh'}
            </button>
            {tab === 'orders' && (
              <button className="adm-topbar-btn adm-topbar-btn-primary" onClick={exportOrders}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                {isAr ? 'تصدير CSV' : 'Export CSV'}
              </button>
            )}
          </div>
        </header>

        <div className="adm-content">
          <div className="adm-time-filter">
            {TIME_FILTERS.map((f) => (
              <button key={f} className={`adm-time-btn ${timeFilter === f ? 'on' : ''}`} onClick={() => setTimeFilter(f)}>
                {f === 'today' ? (isAr ? 'اليوم' : 'Today') : f === 'week' ? (isAr ? 'هذا الأسبوع' : 'This Week') : f === 'month' ? (isAr ? 'هذا الشهر' : 'This Month') : (isAr ? 'الكل' : 'All Time')}
              </button>
            ))}
          </div>

          {tab === 'orders' && (
            <div className="adm-search">
              <svg className="adm-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                type="text"
                placeholder={isAr ? 'بحث بالاسم، الهاتف، الإيميل، أو رقم الطلب…' : 'Search by name, phone, email, or order ID…'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && <button className="adm-search-clear" onClick={() => setSearchQuery('')}>✕</button>}
            </div>
          )}

          {boot ? (
            <div className="adm-loading">
              <div className="nfc-loader" />
              <p>{isAr ? 'جاري تحميل البيانات…' : 'Loading data…'}</p>
            </div>
          ) : tab === 'overview' ? (
            <AdminOverview orders={filteredOrders} total={revenue} pending={pending} processing={processing} shipped={shipped} completed={completed} cancelled={cancelled} users={profiles.length} productCount={productCount} cur={cur} isAr={isAr} />
          ) : tab === 'orders' ? (
            <AdminOrders orders={filteredOrders} change={setStatus} i18n={i18n} cur={cur} isAr={isAr} />
          ) : tab === 'users' ? (
            <AdminUsers profiles={profiles} isAr={isAr} />
          ) : (
            <AdminProducts products={products} toggle={toggleProduct} saveProduct={saveProduct} onSync={syncProductsToFirebase} isAr={isAr} />
          )}
        </div>
      </main>

      {sidebarOpen && <div className="adm-overlay" onClick={() => setSidebarOpen(false)} />}
    </div>
  )
}

function AdminLoading() {
  return (
    <div className="adm">
      <div className="adm-main" style={{ display: 'grid', placeItems: 'center' }}>
        <div className="nfc-loader" />
      </div>
    </div>
  )
}

function AdminOverview({ orders, total, pending, processing, shipped, completed, cancelled, users, productCount, cur, isAr }) {
  const recent = orders.slice(0, 5)

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
  const hasData = orders.length > 0

  return (
    <div className="adm-overview">
      <div className="adm-stats">
        <div className="adm-stat-card adm-stat-green">
          <div className="adm-stat-icon-wrap">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
          </div>
          <div className="adm-stat-body">
            <div className="adm-stat-num">{currency(total)}</div>
            <div className="adm-stat-label">{isAr ? 'إجمالي الإيرادات' : 'Total Revenue'}</div>
          </div>
          <div className="adm-stat-sparkline" />
        </div>
        <div className="adm-stat-card adm-stat-blue">
          <div className="adm-stat-icon-wrap">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
          </div>
          <div className="adm-stat-body">
            <div className="adm-stat-num">{orders.length}</div>
            <div className="adm-stat-label">{isAr ? 'إجمالي الطلبات' : 'Total Orders'}</div>
          </div>
        </div>
        <div className="adm-stat-card adm-stat-amber">
          <div className="adm-stat-icon-wrap">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div className="adm-stat-body">
            <div className="adm-stat-num">{pending}</div>
            <div className="adm-stat-label">{isAr ? 'قيد الانتظار' : 'Pending'}</div>
          </div>
        </div>
        <div className="adm-stat-card adm-stat-purple">
          <div className="adm-stat-icon-wrap">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
          </div>
          <div className="adm-stat-body">
            <div className="adm-stat-num">{users}</div>
            <div className="adm-stat-label">{isAr ? 'المستخدمون' : 'Users'}</div>
          </div>
        </div>
      </div>

      <div className="adm-card adm-chart-card">
        <div className="adm-card-header">
          <div>
            <h3>{isAr ? 'الإيرادات هذا الأسبوع' : 'Revenue This Week'}</h3>
            <p className="adm-card-subtitle">{isAr ? 'آخر 7 أيام' : 'Last 7 days'}</p>
          </div>
        </div>
        {!hasData ? (
          <div className="adm-empty-chart">
            <div className="adm-empty-chart-bars">
              {[0.3, 0.5, 0.2, 0.6, 0.4, 0.7, 0.35].map((h, i) => (
                <div key={i} className="adm-empty-bar-col">
                  <div className="adm-empty-bar-track">
                    <div className="adm-empty-bar" style={{ height: `${h * 100}%` }} />
                  </div>
                  <div className="adm-empty-bar-label">{['سبت', 'أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة'][i]}</div>
                </div>
              ))}
            </div>
            <div className="adm-empty-overlay">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
              <p>{isAr ? 'ستظهر البيانات هنا بعد أول طلب' : 'Data will appear after the first order'}</p>
            </div>
          </div>
        ) : (
        <div className="adm-chart">
          {barData.map((d, i) => (
            <div key={i} className="adm-bar-col">
              <div className="adm-bar-val">{d.revenue > 0 ? currency(d.revenue) : ''}</div>
              <div className="adm-bar-track">
                <div className="adm-bar" style={{ height: `${Math.max((d.revenue / maxRevenue) * 100, d.count > 0 ? 8 : 2)}%` }} />
              </div>
              <div className="adm-bar-label">{d.label}</div>
              <div className="adm-bar-count">{d.count > 0 ? d.count : ''}</div>
            </div>
          ))}
        </div>
        )}
      </div>

      <div className="adm-grid-2">
        <div className="adm-card">
          <div className="adm-card-header">
            <h3>{isAr ? 'أحدث الطلبات' : 'Recent Orders'}</h3>
            <Link to="#" className="adm-card-link" onClick={(e) => { e.preventDefault() }}>{isAr ? 'عرض الكل' : 'View All'}</Link>
          </div>
          {!hasData ? (
            <div className="adm-empty-state">
              <div className="adm-empty-state-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
              </div>
              <p className="adm-empty-title">{isAr ? 'لا طلبات بعد' : 'No orders yet'}</p>
              <p className="adm-empty-desc">{isAr ? 'ستظهر الطلبات هنا automáticamente' : 'Orders will appear here automatically'}</p>
            </div>
          ) : (
            <div className="adm-list">
              {recent.map((o) => (
                <div key={o.id} className="adm-list-item">
                  <div className="adm-list-left">
                    <div className="adm-list-avatar" style={{ background: STATUS_COLORS[o.status]?.bg || '#f3f4f6', color: STATUS_COLORS[o.status]?.text || '#6b7280' }}>
                      {(o.customer?.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="adm-list-info">
                      <div className="adm-list-name">{o.customer?.name || '—'}</div>
                      <div className="adm-list-sub">#{o.id.slice(0, 6)}</div>
                    </div>
                  </div>
                  <div className="adm-list-right">
                    <div className="adm-list-amount">{currency(o.total)} {cur}</div>
                    <StatusBadge s={o.status} isAr={isAr} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="adm-card">
          <div className="adm-card-header">
            <h3>{isAr ? 'ملخص سريع' : 'Quick Summary'}</h3>
          </div>
          {!hasData ? (
            <div className="adm-empty-state">
              <div className="adm-empty-state-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              </div>
              <p className="adm-empty-title">{isAr ? 'لا توجد بيانات' : 'No data yet'}</p>
              <p className="adm-empty-desc">{isAr ? 'ستظهر الإحصائيات هنا' : 'Stats will show here'}</p>
            </div>
          ) : (
          <div className="adm-summary">
            <div className="adm-summary-row">
              <div className="adm-summary-left">
                <div className="adm-summary-dot" style={{ background: '#10b981' }} />
                <span>{isAr ? 'معدل الإتمام' : 'Completion Rate'}</span>
              </div>
              <div className="adm-summary-right">
                <div className="adm-summary-bar">
                  <div className="adm-summary-fill" style={{ width: `${(completed / orders.length) * 100}%`, background: 'linear-gradient(90deg, #10b981, #34d399)' }} />
                </div>
                <span className="adm-summary-val" style={{ color: '#10b981' }}>{Math.round((completed / orders.length) * 100)}%</span>
              </div>
            </div>
            <div className="adm-summary-row">
              <div className="adm-summary-left">
                <div className="adm-summary-dot" style={{ background: '#ef4444' }} />
                <span>{isAr ? 'معدل الإلغاء' : 'Cancellation Rate'}</span>
              </div>
              <div className="adm-summary-right">
                <div className="adm-summary-bar">
                  <div className="adm-summary-fill" style={{ width: `${(cancelled / orders.length) * 100}%`, background: 'linear-gradient(90deg, #ef4444, #f87171)' }} />
                </div>
                <span className="adm-summary-val" style={{ color: '#ef4444' }}>{Math.round((cancelled / orders.length) * 100)}%</span>
              </div>
            </div>
            <div className="adm-summary-divider" />
            <div className="adm-summary-stats">
              <div className="adm-summary-stat">
                <div className="adm-summary-stat-val">{orders.length > 0 ? currency(total / orders.length) : 0}</div>
                <div className="adm-summary-stat-label">{isAr ? 'متوسط الطلب' : 'Avg Order'}</div>
              </div>
              <div className="adm-summary-stat">
                <div className="adm-summary-stat-val">{productCount}</div>
                <div className="adm-summary-stat-label">{isAr ? 'منتجات نشطة' : 'Active Products'}</div>
              </div>
            </div>
          </div>
          )}
        </div>
      </div>

      <div className="adm-card adm-status-overview-card">
        <div className="adm-card-header">
          <h3>{isAr ? 'حالة الطلبات' : 'Order Status'}</h3>
        </div>
        <div className="adm-status-grid">
          {[
            { label: isAr ? 'قيد الانتظار' : 'Pending', count: pending, color: '#f59e0b', bg: '#fffbeb' },
            { label: isAr ? 'قيد المعالجة' : 'Processing', count: processing, color: '#3b82f6', bg: '#eff6ff' },
            { label: isAr ? 'تم الشحن' : 'Shipped', count: shipped, color: '#8b5cf6', bg: '#f5f3ff' },
            { label: isAr ? 'مكتمل' : 'Completed', count: completed, color: '#10b981', bg: '#ecfdf5' },
            { label: isAr ? 'ملغي' : 'Cancelled', count: cancelled, color: '#ef4444', bg: '#fef2f2' },
          ].map((s, i) => (
            <div key={i} className="adm-status-item" style={{ '--accent': s.color }}>
              <div className="adm-status-dot" style={{ background: s.color }} />
              <div className="adm-status-info">
                <div className="adm-status-count">{s.count}</div>
                <div className="adm-status-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function AdminOrders({ orders, change, i18n, cur, isAr }) {
  const [open, setOpen] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return orders
    return orders.filter((o) => o.status === statusFilter)
  }, [orders, statusFilter])

  return (
    <div className="adm-card">
      <div className="adm-card-header">
        <div>
          <h3>{isAr ? 'الطلبات' : 'Orders'} <span className="adm-count">({filtered.length})</span></h3>
        </div>
        <div className="adm-filter-pills">
          <button className={`adm-pill ${statusFilter === 'all' ? 'on' : ''}`} onClick={() => setStatusFilter('all')}>{isAr ? 'الكل' : 'All'}</button>
          {STATUSES.map((s) => (
            <button key={s} className={`adm-pill ${statusFilter === s ? 'on' : ''}`} onClick={() => setStatusFilter(s)}>{i18n(s)}</button>
          ))}
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="adm-empty-state">
          <div className="adm-empty-state-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
          </div>
          <p className="adm-empty-title">{isAr ? 'لا توجد طلبات' : 'No orders found'}</p>
          <p className="adm-empty-desc">{isAr ? 'لم يتم العثور على طلبات تطابق البحث' : 'No orders match your search'}</p>
        </div>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{isAr ? 'العميل' : 'Customer'}</th>
                <th>{isAr ? 'المنتجات' : 'Items'}</th>
                <th>{isAr ? 'الإجمالي' : 'Total'}</th>
                <th>{isAr ? 'التاريخ' : 'Date'}</th>
                <th>{isAr ? 'الحالة' : 'Status'}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <OrderRow key={o.id} o={o} open={open === o.id} onToggle={() => setOpen(open === o.id ? null : o.id)} change={change} i18n={i18n} cur={cur} isAr={isAr} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function OrderRow({ o, open, onToggle, change, i18n, cur, isAr }) {
  const date = o.createdAt ? new Date(o.createdAt).toLocaleDateString(isAr ? 'ar' : 'en', { month: 'short', day: 'numeric' }) : '—'
  return (
    <>
      <tr className={open ? 'expanded' : ''}>
        <td className="adm-mono">#{o.id.slice(0, 8)}</td>
        <td>
          <div className="adm-order-customer">
            <div className="adm-list-avatar small" style={{ background: STATUS_COLORS[o.status]?.bg || '#f3f4f6', color: STATUS_COLORS[o.status]?.text || '#6b7280' }}>
              {(o.customer?.name || '?').charAt(0).toUpperCase()}
            </div>
            <div>
              <b>{o.customer?.name || '—'}</b>
              <div className="adm-order-contact">{o.customer?.phone} · {o.email}</div>
            </div>
          </div>
        </td>
        <td className="adm-order-items">{(o.items || []).map((i) => `${i.name} ×${i.qty}`).join(', ') || '—'}</td>
        <td className="adm-money">{currency(o.total)} {cur}</td>
        <td className="adm-date">{date}</td>
        <td>
          <select className="adm-status-select" value={o.status || 'pending'} onChange={(e) => change(o.id, e.target.value)}>
            {STATUSES.map((s) => <option key={s} value={s}>{i18n(s)}</option>)}
          </select>
        </td>
        <td><button className="adm-expand-btn" onClick={onToggle}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: '0.2s' }}><polyline points="6 9 12 15 18 9"/></svg>
        </button></td>
      </tr>
      {open && (
        <tr className="adm-detail-row">
          <td colSpan={7}>
            <div className="adm-detail">
              <div className="adm-detail-grid">
                <div className="adm-detail-field"><span>{isAr ? 'الاسم' : 'Name'}</span><b>{o.customer?.name || '—'}</b></div>
                <div className="adm-detail-field"><span>{isAr ? 'الهاتف' : 'Phone'}</span><b>{o.customer?.phone || '—'}</b></div>
                <div className="adm-detail-field"><span>{isAr ? 'البريد' : 'Email'}</span><b>{o.email || '—'}</b></div>
                <div className="adm-detail-field"><span>{isAr ? 'المدينة' : 'City'}</span><b>{o.customer?.city || '—'}</b></div>
                <div className="adm-detail-field"><span>{isAr ? 'العنوان' : 'Address'}</span><b>{o.customer?.address || '—'}</b></div>
                <div className="adm-detail-field"><span>UID</span><b className="adm-mono">{o.uid}</b></div>
              </div>
              {(o.items || []).length > 0 && (
                <div className="adm-detail-items">
                  <span className="adm-detail-items-title">{isAr ? 'المنتجات' : 'Items'}</span>
                  {(o.items || []).map((it, i) => (
                    <div key={i} className="adm-detail-item">
                      <span>· {it.name} × {it.qty}</span>
                      <b className="adm-money">{currency(it.qty * it.price)} {cur}</b>
                    </div>
                  ))}
                </div>
              )}
              {o.customer?.notes && (
                <div className="adm-detail-notes">
                  <span>{isAr ? 'ملاحظات' : 'Notes'}</span>
                  <p>{o.customer.notes}</p>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

function AdminUsers({ profiles, isAr }) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search) return profiles
    const q = search.toLowerCase()
    return profiles.filter((p) =>
      (p.name || '').toLowerCase().includes(q) ||
      (p.email || '').toLowerCase().includes(q)
    )
  }, [profiles, search])

  return (
    <div className="adm-card">
      <div className="adm-card-header">
        <h3>{isAr ? 'المستخدمون' : 'Users'} <span className="adm-count">({filtered.length})</span></h3>
      </div>
      <div className="adm-search" style={{ marginBottom: 16 }}>
        <svg className="adm-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input
          type="text"
          placeholder={isAr ? 'بحث بالاسم أو الإيميل…' : 'Search by name or email…'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {filtered.length === 0 ? (
        <div className="adm-empty-state">
          <div className="adm-empty-state-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          </div>
          <p className="adm-empty-title">{isAr ? 'لا مستخدمين بعد' : 'No users yet'}</p>
          <p className="adm-empty-desc">{isAr ? 'سيظهر المستخدمون هنا عند التسجيل' : 'Users will appear here upon registration'}</p>
        </div>
      ) : (
        <div className="adm-list">
          {filtered.map((p) => (
            <div key={p.id} className="adm-list-item">
              <div className="adm-list-left">
                <div className="adm-list-avatar">{(p.name || '?').charAt(0).toUpperCase()}</div>
                <div className="adm-list-info">
                  <div className="adm-list-name">{p.name || '—'}</div>
                  <div className="adm-list-sub">{p.email || '—'}</div>
                </div>
              </div>
              <div className="adm-list-right">
                <div className="adm-list-sub">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}</div>
                <div className="adm-list-sub adm-mono">{(p.uid || p.id || '').slice(0, 8)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function AdminProducts({ products, toggle, saveProduct, onSync, isAr }) {
  const [editing, setEditing] = useState(null)
  
  const handleEdit = (p) => {
    setEditing({ ...p })
  }
  
  const handleSave = () => {
    if (editing) {
      saveProduct(editing)
      setEditing(null)
    }
  }

  return (
    <div className="adm-card">
      <div className="adm-card-header">
        <h3>{isAr ? 'المنتجات' : 'Products'}</h3>
        <button className="btn btn-primary btn-sm" onClick={onSync}>
          {isAr ? 'مزامنة المنتجات الأساسية' : 'Sync Default Products'}
        </button>
      </div>
      <div className="adm-product-grid">
        {products.map((p) => (
          <div className={`adm-product-card ${p.active === false ? 'disabled' : ''}`} key={p.id}>
            <div className="adm-product-img" style={{ background: p.color }}>
              <img src={`/img/${p.img}`} alt={p.nameEn} loading="lazy" />
              {p.popular && <span className="adm-product-badge">{isAr ? 'الأكثر مبيعًا' : 'Popular'}</span>}
              {p.active === false && <div className="adm-product-overlay">{isAr ? 'متوقف' : 'Disabled'}</div>}
            </div>
            <div className="adm-product-body">
              <h4>{isAr ? p.nameAr : p.nameEn}</h4>
              <div className="adm-product-price">{p.price} {isAr ? 'ج.م' : 'EGP'}</div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => handleEdit(p)}>
                  {isAr ? 'تعديل' : 'Edit'}
                </button>
                <button className={`btn ${p.active === false ? 'btn-primary' : 'btn-ghost'} btn-sm`} style={{ flex: 1 }} onClick={() => toggle(p.id, p.active !== false ? false : true)}>
                  {p.active === false ? (isAr ? 'تفعيل' : 'Enable') : (isAr ? 'إيقاف' : 'Disable')}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="adm-modal-overlay">
          <div className="adm-modal">
            <div className="adm-modal-header">
              <h3>{isAr ? 'تعديل المنتج' : 'Edit Product'}</h3>
              <button className="adm-modal-close" onClick={() => setEditing(null)}>✕</button>
            </div>
            <div className="adm-modal-body">
              <div className="adm-form-group">
                <label>{isAr ? 'الاسم بالإنجليزية' : 'Name (EN)'}</label>
                <input type="text" value={editing.nameEn || ''} onChange={(e) => setEditing({...editing, nameEn: e.target.value})} />
              </div>
              <div className="adm-form-group">
                <label>{isAr ? 'الاسم بالعربية' : 'Name (AR)'}</label>
                <input type="text" value={editing.nameAr || ''} onChange={(e) => setEditing({...editing, nameAr: e.target.value})} />
              </div>
              <div className="adm-form-group">
                <label>{isAr ? 'السعر' : 'Price'}</label>
                <input type="number" value={editing.price || ''} onChange={(e) => setEditing({...editing, price: Number(e.target.value)})} />
              </div>
              <div className="adm-form-group">
                <label>{isAr ? 'السعر قبل الخصم' : 'Original Price'}</label>
                <input type="number" value={editing.originalPrice || ''} onChange={(e) => setEditing({...editing, originalPrice: Number(e.target.value)})} />
              </div>
            </div>
            <div className="adm-modal-footer">
              <button className="btn btn-ghost" onClick={() => setEditing(null)}>{isAr ? 'إلغاء' : 'Cancel'}</button>
              <button className="btn btn-primary" onClick={handleSave}>{isAr ? 'حفظ' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ s, isAr }) {
  const c = STATUS_COLORS[s] || STATUS_COLORS.pending
  const labels = { pending: isAr ? 'قيد الانتظار' : 'Pending', processing: isAr ? 'قيد المعالجة' : 'Processing', shipped: isAr ? 'تم الشحن' : 'Shipped', done: isAr ? 'مكتمل' : 'Completed', cancelled: isAr ? 'ملغي' : 'Cancelled' }
  return (
    <span className="adm-status-badge" style={{ background: c.bg, color: c.text }}>
      <span className="adm-status-dot" style={{ background: c.dot }} />
      {labels[s] || s}
    </span>
  )
}

function currency(amount) {
  const n = Number(amount || 0)
  return n.toLocaleString('en-EG')
}
