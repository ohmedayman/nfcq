import React, { lazy, Suspense } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

// Resilient lazy loader that retries once on network / chunk error
function safeLazy(importFn) {
  return lazy(async () => {
    try {
      return await importFn()
    } catch (err) {
      console.warn('[safeLazy] Initial load failed, retrying once...', err)
      // Retry once after 500ms
      await new Promise((r) => setTimeout(r, 500))
      try {
        return await importFn()
      } catch (retryErr) {
        console.error('[safeLazy] Retry failed:', retryErr)
        throw retryErr
      }
    }
  })
}

const Home = safeLazy(() => import('./pages/Home'))
const Store = safeLazy(() => import('./pages/Store'))
const ProductDetail = safeLazy(() => import('./pages/ProductDetail'))
const Account = safeLazy(() => import('./pages/Account'))
const Dashboard = safeLazy(() => import('./pages/Dashboard'))
const NfcPage = safeLazy(() => import('./pages/NfcPage'))
const PublicNfc = safeLazy(() => import('./pages/PublicNfc'))
const Admin = safeLazy(() => import('./pages/Admin'))
const Onboarding = safeLazy(() => import('./pages/Onboarding'))
const Blog = safeLazy(() => import('./pages/Blog').then(m => ({ default: m.default })))
const BlogPost = safeLazy(() => import('./pages/Blog').then(m => ({ default: m.BlogPost })))
const Settings = safeLazy(() => import('./pages/Settings'))
const Contact = safeLazy(() => import('./pages/Contact'))

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '75vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 52, marginBottom: 14 }}>⚠️</div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: 8 }}>حدث تحديث في الصفحة</h2>
          <p style={{ color: 'var(--muted)', maxWidth: 440, fontSize: '0.9rem', marginBottom: 22, lineHeight: 1.6 }}>
            تم نشر تحديث جديد للموقع. اضغط على الزر أدناه لتحديث الصفحة والبدء فورا.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => {
              this.setState({ hasError: false })
              window.location.reload()
            }}
          >
            🔄 إعادة تحميل الصفحة
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

function PageLoader() {
  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
      <div className="nfc-loader" />
    </div>
  )
}

export default function App() {
  const location = useLocation()
  const isNfc = location.pathname.startsWith('/nfc') || location.pathname.startsWith('/u/')

  return (
    <ErrorBoundary>
      {!isNfc && <Navbar />}
      <main>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/store" element={<Store />} />
            <Route path="/store/:id" element={<ProductDetail />} />
            <Route path="/account" element={<Account />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/nfc/demo" element={<NfcPage />} />
            <Route path="/u/:uid" element={<PublicNfc />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </Suspense>
      </main>
      {!isNfc && <Footer />}
    </ErrorBoundary>
  )
}
