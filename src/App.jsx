import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Store from './pages/Store'
import ProductDetail from './pages/ProductDetail'
import Account from './pages/Account'
import Dashboard from './pages/Dashboard'
import NfcPage from './pages/NfcPage'
import PublicNfc from './pages/PublicNfc'
import Admin from './pages/Admin'
import Onboarding from './pages/Onboarding'

export default function App() {
  const location = useLocation()
  const isNfc = location.pathname.startsWith('/nfc') || location.pathname.startsWith('/u/')

  return (
    <>
      {!isNfc && <Navbar />}
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/store" element={<Store />} />
          <Route path="/store/:id" element={<ProductDetail />} />
          <Route path="/account" element={<Account />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/nfc/demo" element={<NfcPage />} />
          <Route path="/u/:uid" element={<PublicNfc />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      {!isNfc && <Footer />}
    </>
  )
}