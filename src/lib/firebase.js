import firebaseConfig, { FIREBASE_READY } from '../firebase.config'

let app = null
let auth = null
let _authModule = null
let _appModule = null

async function loadAuth() {
  if (!_authModule) _authModule = await import('firebase/auth')
  return _authModule
}

async function loadApp() {
  if (!_appModule) _appModule = await import('firebase/app')
  return _appModule
}

async function ensureApp() {
  if (!FIREBASE_READY) return false
  if (!app) {
    const appMod = await loadApp()
    app = appMod.getApps().length ? appMod.getApp() : appMod.initializeApp(firebaseConfig)
  }
  if (!auth) {
    const authMod = await loadAuth()
    auth = authMod.getAuth(app)
  }
  return true
}

function getAppRef() { return app }

export async function getAuth() { await ensureApp(); return auth }

export const authApi = {
  isReady: () => FIREBASE_READY,
  register: async (email, password) => {
    if (!FIREBASE_READY) throw new Error('FIREBASE_NOT_CONFIGURED')
    await ensureApp()
    const { createUserWithEmailAndPassword } = await loadAuth()
    return createUserWithEmailAndPassword(auth, email, password)
  },
  login: async (email, password) => {
    if (!FIREBASE_READY) throw new Error('FIREBASE_NOT_CONFIGURED')
    await ensureApp()
    const { signInWithEmailAndPassword } = await loadAuth()
    return signInWithEmailAndPassword(auth, email, password)
  },
  loginWithGoogle: async () => {
    if (!FIREBASE_READY) throw new Error('FIREBASE_NOT_CONFIGURED')
    await ensureApp()
    const { signInWithPopup, GoogleAuthProvider } = await loadAuth()
    return signInWithPopup(auth, new GoogleAuthProvider())
  },
  logout: async () => {
    if (!FIREBASE_READY) return
    await ensureApp()
    const { signOut } = await loadAuth()
    return signOut(auth)
  },
  sendPasswordReset: async (email) => {
    if (!FIREBASE_READY) throw new Error('FIREBASE_NOT_CONFIGURED')
    await ensureApp()
    const { sendPasswordResetEmail } = await loadAuth()
    return sendPasswordResetEmail(auth, email)
  },
  onState: (cb) => {
    if (!FIREBASE_READY) { cb(null); return () => {} }
    let unsub = null
    ensureApp().then(async () => {
      const { onAuthStateChanged } = await loadAuth()
      unsub = onAuthStateChanged(auth, cb)
    })
    return () => { if (unsub) unsub() }
  },
}

let _servicesLoaded = false
async function loadServices() {
  if (!FIREBASE_READY) return null
  await ensureApp()
  if (!_servicesLoaded) {
    const svc = await import('./firebase-services')
    svc.setFirebaseDeps(getAppRef)
    _servicesLoaded = true
  }
  return import('./firebase-services')
}

export async function getUserProfileRef(uid) { return (await loadServices()).getUserProfileRef(uid) }
export async function initProfileIfMissing(uid, email, name) { return (await loadServices()).initProfileIfMissing(uid, email, name) }
export async function fetchProfile(uid) { return (await loadServices()).fetchProfile(uid) }
export async function saveProfile(uid, data) { return (await loadServices()).saveProfile(uid, data) }
export async function uploadAvatar(uid, file) { return (await loadServices()).uploadAvatar(uid, file) }
export async function createOrder(uid, payload) { return (await loadServices()).createOrder(uid, payload) }
export async function fetchPublic(uid) {
  if (!uid) return null
  try {
    const svc = await loadServices()
    const result = await svc.fetchProfile(uid)
    if (result) return result
  } catch (err) {
    console.warn('[fetchPublic] Service fetch error:', err?.message)
  }

  // Tier 2: Check localStorage cache
  try {
    const cached = localStorage.getItem(`lamsa_profile_${uid}`)
    if (cached) return JSON.parse(cached)
  } catch {}

  // Tier 3: If viewing own profile while signed in
  try {
    const cur = authApi.currentUser()
    if (cur && cur.uid === uid) {
      return {
        uid: cur.uid,
        name: cur.displayName || cur.email?.split('@')[0] || 'User',
        email: cur.email || '',
        role: '',
        bio: '',
        links: [],
        social: {},
        theme: 'default',
        activated: true,
      }
    }
  } catch {}

  return null
}
export async function listOrders() { return (await loadServices()).listOrders() }
export async function updateOrderStatus(orderId, status) { return (await loadServices()).updateOrderStatus(orderId, status) }
export async function listProfiles() { return (await loadServices()).listProfiles() }
export async function adminUpdateProfile(uid, data) { return (await loadServices()).adminUpdateProfile(uid, data) }
export async function isAdminUser(uid) { return (await loadServices()).isAdminUser(uid) }
export async function grantAdmin(uid) { return (await loadServices()).grantAdmin(uid) }
export async function listProducts() { return (await loadServices()).listProducts() }
export async function setProductActive(id, on) { return (await loadServices()).setProductActive(id, on) }
export async function upsertProduct(id, data) { return (await loadServices()).upsertProduct(id, data) }
export async function listUserOrders(uid) { return (await loadServices()).listUserOrders(uid) }
export async function trackProfileView(uid) { return (await loadServices()).trackProfileView(uid) }
export async function trackLinkClick(uid, url, label) { return (await loadServices()).trackLinkClick(uid, url, label) }
export async function saveLead(profileUid, data) { return (await loadServices()).saveLead(profileUid, data) }
export async function listLeads(profileUid) { return (await loadServices()).listLeads(profileUid) }
export async function getProfileAnalytics(uid) { return (await loadServices()).getProfileAnalytics(uid) }
