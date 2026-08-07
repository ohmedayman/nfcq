import { createContext, useContext, useEffect, useState } from 'react'
import { authApi, initProfileIfMissing, isAdminUser } from '../lib/firebase'
import { FIREBASE_READY, ADMIN_EMAILS } from '../firebase.config'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (!FIREBASE_READY) {
      // Demo mode: nothing persisted to a server
      setLoading(false)
      setError('FIREBASE_NOT_CONFIGURED')
      return
    }
    const unsub = authApi.onState(async (u) => {
      setUser(u)
      setLoading(false)
      if (u) {
        const admin = ADMIN_EMAILS.includes((u.email || '').toLowerCase()) || await isAdminUser(u.uid)
        setIsAdmin(admin)
      } else {
        setIsAdmin(false)
      }
    })
    return unsub
  }, [])

  async function register(email, password, name) {
    setError('')
    try {
      const cred = await authApi.register(email, password)
      await initProfileIfMissing(cred.user.uid, email, name)
      return true
    } catch (e) {
      setError(e.message)
      return false
    }
  }

  async function login(email, password) {
    setError('')
    try {
      await authApi.login(email, password)
      return true
    } catch (e) {
      setError(e.message)
      return false
    }
  }

  async function loginWithGoogle() {
    setError('')
    try {
      const cred = await authApi.loginWithGoogle()
      await initProfileIfMissing(cred.user.uid, cred.user.email, cred.user.displayName || '')
      return true
    } catch (e) {
      setError(e.message)
      return false
    }
  }

  async function logout() {
    await authApi.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, isAdmin, register, login, loginWithGoogle, logout, ready: FIREBASE_READY }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}