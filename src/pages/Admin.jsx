import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { listOrders, updateOrderStatus, listProfiles, adminUpdateProfile, listProducts, setProductActive, upsertProduct } from '../lib/firebase'
import { PRODUCTS as STATIC_PRODUCTS } from '../data/content'
import { toast } from '../components/Toast'
import { normalizeSocialUrl, detectPlatformInfo } from '../lib/utils'
import {
  IconRefresh, IconUser, IconLink, IconZap, IconCheck, IconPhone, IconMail,
  PlatformIcon, IconVerified, NfcIcon,
} from '../components/icons'

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

  // Notifications
  const [notifications, setNotifications] = useState([])
  const [showNotifs, setShowNotifs] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Selected customer for modal inspector
  const [selectedUser, setSelectedUser] = useState(null)

  const cur = isAr ? 'ج.م' : 'EGP'

  useEffect(() => {
    if (loading) return
    if (!user) { nav('/account'); return }
    if (!isAdmin) { toast(isAr ? 'ليس لديك صلاحية المدير' : 'Owner access only', 'error'); nav('/'); return }
    loadAll()

    // Listen to real-time local order events
    function handleNewOrder(e) {
      if (e.detail) {
        toast(isAr ? `🔔 طلب جديد: ${e.detail.customer?.name || 'عميل'} (${e.detail.total} ج.م)` : `🔔 New order from ${e.detail.customer?.name || 'Customer'}`)
        loadAll()
      }
    }
    window.addEventListener('lamsa_order_created', handleNewOrder)
    return () => window.removeEventListener('lamsa_order_created', handleNewOrder)
  }, [user, loading, isAdmin])

  async function loadAll() {
    setBoot(true)
    try {
      const [o, p, pr] = await Promise.all([listOrders(), listProfiles(), listProducts()])
      setOrders(o || [])
      setProfiles(p || [])
      if (pr && pr.length) setProducts(pr)

      // Build notifications list
      const notifs = []
      ;(o || []).slice(0, 10).forEach((ord) => {
        notifs.push({
          id: `order_${ord.id}`,
          type: 'order',
          title: isAr ? `طلب جديد #${ord.id.slice(0, 6)}` : `New Order #${ord.id.slice(0, 6)}`,
          desc: `${ord.customer?.name || 'عميل'} — ${ord.total} ${cur}`,
          time: ord.createdAt || Date.now(),
          status: ord.status,
          raw: ord,
        })
      })
      ;(p || []).slice(0, 5).forEach((prof) => {
        notifs.push({
          id: `user_${prof.uid || prof.id}`,
          type: 'user',
          title: isAr ? 'تسجيل مستخدم جديد' : 'New User Signup',
          desc: `${prof.name || 'مستخدم جديد'} (${prof.email || ''})`,
          time: prof.updatedAt || prof.createdAt || Date.now(),
          raw: prof,
        })
      })
      notifs.sort((a, b) => b.time - a.time)
      setNotifications(notifs)
      setUnreadCount(notifs.filter((n) => n.type === 'order' && n.status === 'pending').length)
    } catch (err) {
      console.warn('[Admin loadAll error]:', err)
    }
    setBoot(false)
  }

  async function setStatus(id, val) {
    await updateOrderStatus(id, val)
    setOrders((o) => o.map((x) => (x.id === id ? { ...x, status: val } : x)))
    toast(isAr ? 'تم تحديث حالة الطلب ✓' : 'Order status updated ✓')
  }

  async function handleCustomerSave(uid, updatedData) {
    try {
      await adminUpdateProfile(uid, updatedData)
      setProfiles((prev) => prev.map((p) => ((p.uid === uid || p.id === uid) ? { ...p, ...updatedData } : p)))
      setSelectedUser(null)
      toast(isAr ? 'تم تحديث بيانات العميل بنجاح ✓' : 'Customer profile updated ✓')
    } catch (err) {
      console.error(err)
      toast(isAr ? 'فشل حفظ البيانات' : 'Failed to update', 'error')
    }
  }

  async function toggleCustomerActivation(uid, currentStatus) {
    const nextStatus = !currentStatus
    try {
      await adminUpdateProfile(uid, { activated: nextStatus })
      setProfiles((prev) => prev.map((p) => ((p.uid === uid || p.id === uid) ? { ...p, activated: nextStatus } : p)))
      if (selectedUser && (selectedUser.uid === uid || selectedUser.id === uid)) {
        setSelectedUser((u) => ({ ...u, activated: nextStatus }))
      }
      toast(nextStatus ? (isAr ? 'تم تفعيل بطاقة العميل رسمياً ✓' : 'Card activated ✓') : (isAr ? 'تم تحويل البطاقة لوضع المعاينة' : 'Card set to preview'))
    } catch (err) {
      console.error(err)
    }
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
    { id: 'users', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>, label: isAr ? 'العملاء والبطاقات' : 'Customers & Cards', badge: profiles.length },
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
              <span className="adm-logo-sub">{isAr ? 'لوحة الإدارة الشاملة' : 'Admin Panel'}</span>
            </div>
          </Link>
          <button className="adm-sidebar-close" onClick={() => setSidebarOpen(false)}>✕</button>
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
            <span className="adm-nav-icon"><IconUser /></span>
            <span className="adm-nav-label">{isAr ? 'لوحة بطاقتي الشخصية' : 'My Dashboard'}</span>
          </Link>
          <Link to="/" className="adm-nav-item" onClick={() => setSidebarOpen(false)}>
            <span className="adm-nav-icon"><NfcIcon /></span>
            <span className="adm-nav-label">{isAr ? 'الموقع العام' : 'Website'}</span>
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
            <span>{isAr ? 'تسجيل الخروج' : 'Sign Out'}</span>
          </button>
        </div>
      </aside>

      <main className="adm-main">
        <header className="adm-topbar">
          <button className="adm-hamburger" onClick={() => setSidebarOpen(true)}>☰</button>
          <div className="adm-topbar-left">
            <h1 className="adm-page-title">{tabs.find(t => t.id === tab)?.label}</h1>
          </div>
          <div className="adm-topbar-right" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Notification Bell */}
            <div style={{ position: 'relative' }}>
              <button
                className="adm-topbar-btn"
                onClick={() => setShowNotifs(!showNotifs)}
                style={{ position: 'relative', padding: '8px 14px' }}
                title={isAr ? 'الإشعارات' : 'Notifications'}
              >
                🔔 {isAr ? 'الإشعارات' : 'Alerts'}
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: -4, right: -4, background: '#ef4444', color: '#fff',
                    borderRadius: 99, fontSize: '0.72rem', fontWeight: 800, padding: '2px 6px',
                  }}>
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifs && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: 8, width: 340,
                  background: 'var(--card, #ffffff)', border: '1.5px solid var(--line, #e2e8f0)',
                  borderRadius: 16, boxShadow: '0 16px 40px rgba(0,0,0,0.15)', zIndex: 100,
                  overflow: 'hidden',
                }}>
                  <div style={{ padding: '12px 16px', background: 'var(--bg, #f8fafc)', borderBottom: '1px solid var(--line, #e2e8f0)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <b style={{ fontSize: '0.9rem' }}>{isAr ? '🔔 أحدث الإشعارات' : '🔔 Recent Alerts'}</b>
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{notifications.length} {isAr ? 'إشعار' : 'alerts'}</span>
                  </div>
                  <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: '0.85rem' }}>
                        {isAr ? 'لا توجد إشعارات حالياً' : 'No notifications'}
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          style={{
                            padding: '10px 16px', borderBottom: '1px solid var(--line, #f1f5f9)',
                            display: 'flex', gap: 10, alignItems: 'center', cursor: 'pointer',
                          }}
                          onClick={() => {
                            if (n.type === 'order') setTab('orders')
                            if (n.type === 'user') {
                              setSelectedUser(n.raw)
                              setTab('users')
                            }
                            setShowNotifs(false)
                          }}
                        >
                          <span style={{ fontSize: '1.2rem' }}>{n.type === 'order' ? '🛒' : '👤'}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 800, fontSize: '0.84rem' }}>{n.title}</div>
                            <div style={{ fontSize: '0.76rem', color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.desc}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button className="adm-topbar-btn" onClick={loadAll}>
              <IconRefresh /> {isAr ? 'تحديث البيانات' : 'Refresh'}
            </button>
            {tab === 'orders' && (
              <button className="adm-topbar-btn adm-topbar-btn-primary" onClick={exportOrders}>
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
            <AdminUsers profiles={profiles} onSelectUser={setSelectedUser} onToggleActivation={toggleCustomerActivation} isAr={isAr} />
          ) : (
            <AdminProducts products={products} toggle={toggleProduct} saveProduct={saveProduct} onSync={syncProductsToFirebase} isAr={isAr} />
          )}
        </div>
      </main>

      {/* Customer Inspector & Editor Modal */}
      {selectedUser && (
        <CustomerInspectorModal
          userProfile={selectedUser}
          onClose={() => setSelectedUser(null)}
          onSave={handleCustomerSave}
          onToggleActivation={toggleCustomerActivation}
          isAr={isAr}
        />
      )}

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
  return (
    <div className="adm-overview">
      <div className="adm-kpi-grid">
        <div className="adm-kpi-card" style={{ '--kpi-color': '#1854e8' }}>
          <div className="adm-kpi-info">
            <span className="adm-kpi-label">{isAr ? 'إجمالي المبيعات' : 'Total Revenue'}</span>
            <div className="adm-kpi-value">{currency(total)} <span className="adm-kpi-cur">{cur}</span></div>
          </div>
        </div>
        <div className="adm-kpi-card" style={{ '--kpi-color': '#f59e0b' }}>
          <div className="adm-kpi-info">
            <span className="adm-kpi-label">{isAr ? 'طلبات قيد الانتظار' : 'Pending Orders'}</span>
            <div className="adm-kpi-value">{pending}</div>
          </div>
        </div>
        <div className="adm-kpi-card" style={{ '--kpi-color': '#10b981' }}>
          <div className="adm-kpi-info">
            <span className="adm-kpi-label">{isAr ? 'العملاء والبطاقات' : 'Customers & Cards'}</span>
            <div className="adm-kpi-value">{users}</div>
          </div>
        </div>
        <div className="adm-kpi-card" style={{ '--kpi-color': '#8b5cf6' }}>
          <div className="adm-kpi-info">
            <span className="adm-kpi-label">{isAr ? 'الطلبات المكتملة' : 'Completed'}</span>
            <div className="adm-kpi-value">{completed}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AdminOrders({ orders, change, i18n, cur, isAr }) {
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return orders
    return orders.filter((o) => o.status === statusFilter)
  }, [orders, statusFilter])

  return (
    <div className="adm-card">
      <div className="adm-card-header">
        <div>
          <h3>{isAr ? 'سجل الطلبات' : 'Orders List'} <span className="adm-count">({filtered.length})</span></h3>
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
          <p className="adm-empty-title">{isAr ? 'لا توجد طلبات بعد' : 'No orders found'}</p>
        </div>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{isAr ? 'العميل' : 'Customer'}</th>
                <th>{isAr ? 'طريقة الدفع' : 'Payment'}</th>
                <th>{isAr ? 'المنتجات' : 'Items'}</th>
                <th>{isAr ? 'الإجمالي' : 'Total'}</th>
                <th>{isAr ? 'التاريخ' : 'Date'}</th>
                <th>{isAr ? 'الحالة' : 'Status'}</th>
                <th>{isAr ? 'تواصل' : 'Contact'}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => {
                let phone = o.customer?.phone ? o.customer.phone.replace(/[^0-9]/g, '') : ''
                if (phone.startsWith('01')) phone = '2' + phone
                const waUrl = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(`مرحباً ${o.customer?.name || ''} 👋، بخصوص طلبك من منصة لمسة NFC رقم #${o.id}...`)}` : ''

                return (
                  <tr key={o.id}>
                    <td className="adm-mono">#{o.id}</td>
                    <td>
                      <div>
                        <b>{o.customer?.name || '—'}</b>
                        <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{o.customer?.phone} · {o.customer?.city || ''}</div>
                        {o.customer?.address && <div style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>{o.customer.address}</div>}
                      </div>
                    </td>
                    <td>
                      {o.paymentMethod === 'wallet' ? (
                        <div style={{ fontSize: '0.82rem', color: '#16a34a', fontWeight: 800 }}>
                          📱 {isAr ? 'فودافون كاش / إنستاباي' : 'Wallet / InstaPay'}
                          {o.walletNumber && <div style={{ fontSize: '0.74rem', color: 'var(--muted)', fontWeight: 600 }}>من: {o.walletNumber}</div>}
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.82rem', color: '#d97706', fontWeight: 800 }}>
                          💵 {isAr ? 'عند الاستلام' : 'Cash on Delivery'}
                        </div>
                      )}
                    </td>
                    <td>{(o.items || []).map((i) => `${i.name} ×${i.qty}`).join(', ') || '—'}</td>
                    <td className="adm-money">{currency(o.total)} {cur}</td>
                    <td className="adm-date">{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '—'}</td>
                    <td>
                      <select className="adm-status-select" value={o.status || 'pending'} onChange={(e) => change(o.id, e.target.value)}>
                        {STATUSES.map((s) => <option key={s} value={s}>{i18n(s)}</option>)}
                      </select>
                    </td>
                    <td>
                      {waUrl && (
                        <a href={waUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ color: '#16a34a', fontWeight: 800, whiteSpace: 'nowrap' }}>
                          💬 واتساب
                        </a>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function AdminUsers({ profiles, onSelectUser, onToggleActivation, isAr }) {
  const [search, setSearch] = useState('')
  const [filterActive, setFilterActive] = useState('all')

  const filtered = useMemo(() => {
    return profiles.filter((p) => {
      if (filterActive === 'active' && p.activated !== true) return false
      if (filterActive === 'preview' && p.activated === true) return false
      if (search) {
        const q = search.toLowerCase()
        const matchName = (p.name || '').toLowerCase().includes(q)
        const matchEmail = (p.email || '').toLowerCase().includes(q)
        const matchPhone = (p.phone || '').includes(q)
        const matchRole = (p.role || '').toLowerCase().includes(q)
        if (!matchName && !matchEmail && !matchPhone && !matchRole) return false
      }
      return true
    })
  }, [profiles, search, filterActive])

  return (
    <div className="adm-card">
      <div className="adm-card-header">
        <div>
          <h3>{isAr ? 'العملاء والبطاقات الذكية 👑' : 'Customers & Smart Cards 👑'} <span className="adm-count">({filtered.length})</span></h3>
          <p style={{ fontSize: '0.84rem', color: 'var(--muted)', margin: '4px 0 0' }}>
            {isAr ? 'تحكم في حسابات العملاء، افتح لينكاتهم، فعّل أو أوقف بطاقاتهم الذكية بلمسة واحدة.' : 'Inspect customer links, manage profiles, and toggle smart card activation status.'}
          </p>
        </div>
        <div className="adm-filter-pills">
          <button className={`adm-pill ${filterActive === 'all' ? 'on' : ''}`} onClick={() => setFilterActive('all')}>{isAr ? 'الكل' : 'All'}</button>
          <button className={`adm-pill ${filterActive === 'active' ? 'on' : ''}`} onClick={() => setFilterActive('active')}>{isAr ? 'مفعلة ✓' : 'Active Cards'}</button>
          <button className={`adm-pill ${filterActive === 'preview' ? 'on' : ''}`} onClick={() => setFilterActive('preview')}>{isAr ? 'قيد الانتظار (معاينة)' : 'Preview Mode'}</button>
        </div>
      </div>

      <div className="adm-search" style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder={isAr ? 'بحث بالاسم، الإيميل، الهاتف، المهنة…' : 'Search by name, email, phone, role…'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="adm-empty-state">
          <p className="adm-empty-title">{isAr ? 'لا مستخدمين يطابقون البحث' : 'No users found'}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
          {filtered.map((p) => {
            const uid = p.uid || p.id
            const isActivated = p.activated === true
            const linksCount = (Array.isArray(p.links) ? p.links : []).length
            const socialCount = p.social ? Object.values(p.social).filter(Boolean).length : 0

            return (
              <div
                key={uid}
                style={{
                  border: '1.5px solid var(--line, #e2e8f0)',
                  borderRadius: 16,
                  padding: 16,
                  background: 'var(--card, #fff)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  transition: '0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 46, height: 46, borderRadius: '50%', background: 'linear-gradient(135deg, #1854e8, #0aa5c8)',
                    color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: '1.2rem', flexShrink: 0,
                    overflow: 'hidden',
                  }}>
                    {p.avatar ? <img src={p.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (p.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <b style={{ fontSize: '0.98rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name || 'مستخدم بدون اسم'}</b>
                      {isActivated && <IconVerified size="1.05em" />}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.email || '—'}</div>
                  </div>
                  <span style={{
                    padding: '4px 10px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 800,
                    background: isActivated ? '#ecfdf5' : '#fffbeb',
                    color: isActivated ? '#047857' : '#b45309',
                    border: `1px solid ${isActivated ? '#a7f3d0' : '#fde68a'}`,
                  }}>
                    {isActivated ? (isAr ? 'مفعلة ✓' : 'Active') : (isAr ? 'معاينة' : 'Preview')}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 10, fontSize: '0.82rem', color: 'var(--muted)', background: 'var(--bg, #f8fafc)', padding: '8px 12px', borderRadius: 10 }}>
                  <span>🔗 {linksCount} {isAr ? 'روابط' : 'links'}</span>
                  <span>🌐 {socialCount} {isAr ? 'سوشيال' : 'socials'}</span>
                  {p.phone && <span>📱 {p.phone}</span>}
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => onSelectUser(p)}
                  >
                    ⚙️ {isAr ? 'إدارة وتحكم' : 'Manage'}
                  </button>
                  <a
                    href={`https://lamsa.ink/u/${uid}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-ghost btn-sm"
                    title={isAr ? 'معاينة البطاقة' : 'View Card'}
                  >
                    👁️
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function CustomerInspectorModal({ userProfile, onClose, onSave, onToggleActivation, isAr }) {
  const uid = userProfile.uid || userProfile.id
  const [form, setForm] = useState({
    name: userProfile.name || '',
    role: userProfile.role || '',
    phone: userProfile.phone || '',
    bio: userProfile.bio || '',
    email: userProfile.email || '',
    theme: userProfile.theme || 'default',
    activated: userProfile.activated === true,
  })

  const links = Array.isArray(userProfile.links) ? userProfile.links : []
  const social = userProfile.social || {}

  const setV = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  function handleSaveClick() {
    onSave(uid, form)
  }

  const phoneClean = form.phone ? form.phone.replace(/[^0-9]/g, '') : ''
  const waUrl = phoneClean ? `https://wa.me/${phoneClean}` : ''

  return (
    <div className="adm-modal-overlay" style={{ zIndex: 9999, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.65)' }}>
      <div className="adm-modal" style={{ maxWidth: 640, width: '92%', maxHeight: '90vh', overflowY: 'auto', borderRadius: 20 }}>
        <div className="adm-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0 }}>⚙️ {isAr ? 'لوحة التحكم في حساب العميل' : 'Customer Account Control'}</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>UID: {uid}</span>
          </div>
          <button className="adm-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="adm-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Activation Switcher */}
          <div style={{
            padding: '14px 18px', borderRadius: 14,
            background: form.activated ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
            border: `1.5px solid ${form.activated ? '#10b981' : '#f59e0b'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <b style={{ color: form.activated ? '#059669' : '#d97706', fontSize: '0.96rem' }}>
                {form.activated ? (isAr ? '✅ البطاقة الذكية مفعلة رسمياً' : 'Smart Card Active') : (isAr ? '⚠️ البطاقة في وضع المعاينة (غير مفعلة)' : 'Card in Preview Mode')}
              </b>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--muted)' }}>
                {isAr ? 'يمكنك تفعيل أو إلغاء تفعيل بطاقة العميل مباشرة من هنا.' : 'Toggle NFC activation status instantly.'}
              </p>
            </div>
            <button
              className={`btn ${form.activated ? 'btn-ghost' : 'btn-primary'} btn-sm`}
              onClick={() => {
                const next = !form.activated
                setForm((f) => ({ ...f, activated: next }))
                onToggleActivation(uid, form.activated)
              }}
            >
              {form.activated ? (isAr ? 'إلغاء التفعيل' : 'Deactivate') : (isAr ? 'تفعيل البطاقة الآن' : 'Activate Card')}
            </button>
          </div>

          {/* Quick Direct Actions */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <a href={`https://lamsa.ink/u/${uid}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ flex: 1 }}>
              🌐 {isAr ? 'فتح صفحة العميل' : 'Open Public Card'}
            </a>
            {waUrl && (
              <a href={waUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ flex: 1, color: '#16a34a', fontWeight: 800 }}>
                💬 {isAr ? 'مراسلة واتساب' : 'WhatsApp'}
              </a>
            )}
            {form.phone && (
              <a href={`tel:${form.phone}`} className="btn btn-ghost btn-sm" style={{ flex: 1 }}>
                📞 {isAr ? 'اتصال هاتف' : 'Call'}
              </a>
            )}
          </div>

          {/* Editable Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="adm-form-group">
              <label>{isAr ? 'اسم العميل' : 'Customer Name'}</label>
              <input type="text" value={form.name} onChange={setV('name')} />
            </div>
            <div className="adm-form-group">
              <label>{isAr ? 'المهنة / اللقب' : 'Role / Title'}</label>
              <input type="text" value={form.role} onChange={setV('role')} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="adm-form-group">
              <label>{isAr ? 'البريد الإلكتروني' : 'Email'}</label>
              <input type="email" value={form.email} disabled />
            </div>
            <div className="adm-form-group">
              <label>{isAr ? 'رقم الهاتف' : 'Phone'}</label>
              <input type="text" value={form.phone} onChange={setV('phone')} />
            </div>
          </div>

          <div className="adm-form-group">
            <label>{isAr ? 'نبذة عن العميل (Bio)' : 'Bio'}</label>
            <textarea rows={2} value={form.bio} onChange={setV('bio')} />
          </div>

          {/* Inspect Links */}
          <div>
            <h4 style={{ margin: '8px 0 8px 0', fontSize: '0.92rem' }}>🔗 {isAr ? 'الروابط المخصصة في بطاقة العميل' : 'Customer Custom Links'} ({links.length})</h4>
            {links.length === 0 ? (
              <p style={{ fontSize: '0.82rem', color: 'var(--muted)', margin: 0 }}>{isAr ? 'لم يضف العميل أي روابط بعد.' : 'No custom links added yet.'}</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 160, overflowY: 'auto' }}>
                {links.map((l, i) => {
                  const det = detectPlatformInfo(l.url, l.label)
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', background: 'var(--bg, #f8fafc)', borderRadius: 10, fontSize: '0.84rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 22, height: 22, borderRadius: 6, background: det.color, color: '#fff', display: 'grid', placeItems: 'center', fontSize: '0.75rem' }}>
                          <PlatformIcon name={det.icon} />
                        </span>
                        <b>{l.label || l.url}</b>
                        {l.subtitle && <span style={{ color: 'var(--muted)', fontSize: '0.76rem' }}>({l.subtitle})</span>}
                      </div>
                      <a href={l.url} target="_blank" rel="noreferrer" style={{ color: 'var(--cobalt)', fontSize: '0.8rem', textDecoration: 'underline' }}>
                        {isAr ? 'تجربة' : 'Test'} ↗
                      </a>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Inspect Socials */}
          <div>
            <h4 style={{ margin: '8px 0 8px 0', fontSize: '0.92rem' }}>🌐 {isAr ? 'قنوات السوشيال ميديا' : 'Connected Social Channels'}</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {Object.entries(social).filter(([_, v]) => Boolean(v)).map(([k, v]) => (
                <a key={k} href={normalizeSocialUrl(k, v)} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 99, background: 'var(--bg, #f8fafc)', border: '1px solid var(--line, #e2e8f0)', fontSize: '0.78rem', color: 'var(--text)' }}>
                  <PlatformIcon name={k} /> {k}: <b>{v}</b>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="adm-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
          <button className="btn btn-ghost" onClick={onClose}>{isAr ? 'إلغاء' : 'Cancel'}</button>
          <button className="btn btn-primary" onClick={handleSaveClick}>💾 {isAr ? 'حفظ التعديلات' : 'Save Changes'}</button>
        </div>
      </div>
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

function currency(amount) {
  const n = Number(amount || 0)
  return n.toLocaleString('en-EG')
}
