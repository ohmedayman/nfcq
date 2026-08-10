import { lazy, Suspense } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

const Home = lazy(() => import('./pages/Home'))
const Store = lazy(() => import('./pages/Store'))
const ProductDetail = lazy(() => import('./pages/ProductDetail'))
const Account = lazy(() => import('./pages/Account'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const NfcPage = lazy(() => import('./pages/NfcPage'))
const PublicNfc = lazy(() => import('./pages/PublicNfc'))
const Admin = lazy(() => import('./pages/Admin'))
const Onboarding = lazy(() => import('./pages/Onboarding'))
const Blog = lazy(() => import('./pages/Blog').then(m => ({ default: m.default })))
const BlogPost = lazy(() => import('./pages/Blog').then(m => ({ default: m.BlogPost })))
const Settings = lazy(() => import('./pages/Settings'))

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
    <>
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
            <Route path="*" element={<Home />} />
          </Routes>
        </Suspense>
      </main>
      {!isNfc && <Footer />}
    </>
  )
}
