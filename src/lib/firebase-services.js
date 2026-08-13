let _db = null
let _storage = null
let _getApp = null

export function setFirebaseDeps(getAppFn) {
  _getApp = getAppFn
}

function getAppInstance() {
  if (_getApp) return _getApp()
  return null
}

export async function getDbInstance() {
  if (!_db && _getApp) {
    const { getFirestore } = await import('firebase/firestore')
    _db = getFirestore(getAppInstance())
  }
  return _db
}

export async function getStorageInstance() {
  if (!_storage && _getApp) {
    const app = getAppInstance()
    if (!app) throw new Error('Firebase app not initialized')
    const { getStorage } = await import('firebase/storage')
    _storage = getStorage(app)
  }
  if (!_storage) throw new Error('Firebase Storage not available')
  return _storage
}

export async function getUserProfileRef(uid) {
  const { doc } = await import('firebase/firestore')
  return doc(await getDbInstance(), 'profiles', uid)
}

export async function initProfileIfMissing(uid, email, name) {
  const { getDoc, setDoc } = await import('firebase/firestore')
  const ref = await getUserProfileRef(uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    const initialData = { uid, email, name, role: '', bio: '', links: [], activated: false, createdAt: Date.now() }
    await setDoc(ref, initialData)
    try { localStorage.setItem(`lamsa_profile_${uid}`, JSON.stringify(initialData)) } catch {}
  }
}

export async function fetchProfile(uid) {
  try {
    const { getDoc } = await import('firebase/firestore')
    const snap = await getDoc(await getUserProfileRef(uid))
    if (snap.exists()) {
      const data = snap.data()
      try { localStorage.setItem(`lamsa_profile_${uid}`, JSON.stringify(data)) } catch {}
      return data
    }
  } catch (err) {
    console.warn('[fetchProfile] Firestore fetch failed, checking local storage cache:', err?.message)
  }
  try {
    const cached = localStorage.getItem(`lamsa_profile_${uid}`)
    if (cached) return JSON.parse(cached)
  } catch {}
  return null
}

export async function saveProfile(uid, data) {
  const { setDoc } = await import('firebase/firestore')
  try {
    const cached = localStorage.getItem(`lamsa_profile_${uid}`)
    const merged = { ...(cached ? JSON.parse(cached) : {}), ...data, uid }
    localStorage.setItem(`lamsa_profile_${uid}`, JSON.stringify(merged))
  } catch {}
  return setDoc(await getUserProfileRef(uid), data, { merge: true })
}

export async function uploadAvatar(uid, file) {
  const { setDoc } = await import('firebase/firestore')
  const { compressImage } = await import('./utils')
  
  // 1. Compress image to a fast, high-quality 350x350 Data URL
  const dataUrl = await compressImage(file, 350, 350, 0.85)

  // 2. Attempt Firebase Storage with a 2.5s timeout, falling back seamlessly
  let finalUrl = dataUrl
  try {
    const { ref: storageRef, uploadBytes, getDownloadURL } = await import('firebase/storage')
    const s = await getStorageInstance()
    const ext = (file.name?.split('.').pop() || 'jpg').toLowerCase()
    const r = storageRef(s, `avatars/${uid}.${ext}`)
    
    const res = await fetch(dataUrl)
    const blob = await res.blob()
    
    const uploadPromise = uploadBytes(r, blob).then(() => getDownloadURL(r))
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Storage timeout')), 2500))
    
    finalUrl = await Promise.race([uploadPromise, timeoutPromise])
  } catch (err) {
    console.warn('[uploadAvatar] Storage upload skipped/failed, using compressed data URL:', err?.message)
    finalUrl = dataUrl
  }

  // 3. Save avatar URL in Firestore profile with setDoc({ merge: true })
  try {
    const profileRef = await getUserProfileRef(uid)
    await setDoc(profileRef, { avatar: finalUrl }, { merge: true })
  } catch (err) {
    console.warn('[uploadAvatar] Firestore setDoc failed, saving to localStorage:', err?.message)
    try {
      localStorage.setItem(`lamsa_avatar_${uid}`, finalUrl)
    } catch {}
  }

  return finalUrl
}

export async function createOrder(uid, payload) {
  const orderData = {
    uid,
    items: payload.items,
    total: payload.total,
    currency: payload.currency || 'EGP',
    customer: payload.customer,
    createdAt: Date.now(),
    status: 'pending',
  }

  let firestoreId = `order_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  try {
    const { collection, addDoc } = await import('firebase/firestore')
    const d = await getDbInstance()
    const docRef = await addDoc(collection(d, 'orders'), orderData)
    if (docRef?.id) firestoreId = docRef.id
  } catch (err) {
    console.warn('[createOrder] Firestore addDoc failed, using local cache:', err?.message)
  }

  const savedOrder = { id: firestoreId, ...orderData }

  // Sync to local orders store for seamless Admin view
  try {
    const existing = JSON.parse(localStorage.getItem('lamsa_all_orders') || '[]')
    const updated = [savedOrder, ...existing.filter((o) => o.id !== firestoreId)]
    localStorage.setItem('lamsa_all_orders', JSON.stringify(updated))
    window.dispatchEvent(new CustomEvent('lamsa_order_created', { detail: savedOrder }))
  } catch {}

  return savedOrder
}

export async function fetchProfileForPublic(uid) {
  return fetchProfile(uid)
}

export async function listOrders() {
  let ordersList = []
  try {
    const { collection, getDocs } = await import('firebase/firestore')
    const d = await getDbInstance()
    const snap = await getDocs(collection(d, 'orders'))
    ordersList = snap.docs.map((s) => ({ id: s.id, ...s.data() }))
  } catch (err) {
    console.warn('[listOrders] Firestore query failed, reading local cache:', err?.message)
  }

  // Merge with local cached orders
  try {
    const local = JSON.parse(localStorage.getItem('lamsa_all_orders') || '[]')
    const map = new Map()
    ordersList.forEach((o) => map.set(o.id, o))
    local.forEach((o) => {
      if (!map.has(o.id)) map.set(o.id, o)
    })
    ordersList = Array.from(map.values())
  } catch {}

  return ordersList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
}

export async function updateOrderStatus(orderId, status) {
  try {
    const { doc, updateDoc } = await import('firebase/firestore')
    const d = await getDbInstance()
    await updateDoc(doc(d, 'orders', orderId), { status })
  } catch (err) {
    console.warn('[updateOrderStatus] Firestore updateDoc failed, updating local:', err?.message)
  }

  try {
    const existing = JSON.parse(localStorage.getItem('lamsa_all_orders') || '[]')
    const updated = existing.map((o) => (o.id === orderId ? { ...o, status } : o))
    localStorage.setItem('lamsa_all_orders', JSON.stringify(updated))
  } catch {}
}

export async function listProfiles() {
  let profilesList = []
  try {
    const { collection, getDocs } = await import('firebase/firestore')
    const d = await getDbInstance()
    const snap = await getDocs(collection(d, 'profiles'))
    profilesList = snap.docs.map((s) => ({ id: s.id, uid: s.id, ...s.data() }))
  } catch (err) {
    console.warn('[listProfiles] Firestore query failed, reading local cache:', err?.message)
  }

  // Merge with local profiles
  try {
    const local = JSON.parse(localStorage.getItem('lamsa_all_profiles') || '[]')
    const map = new Map()
    profilesList.forEach((p) => map.set(p.uid || p.id, p))
    local.forEach((p) => {
      const id = p.uid || p.id
      if (id && !map.has(id)) map.set(id, p)
    })
    profilesList = Array.from(map.values())
  } catch {}

  return profilesList
}

export async function adminUpdateProfile(uid, data) {
  try {
    const { doc, setDoc } = await import('firebase/firestore')
    const d = await getDbInstance()
    await setDoc(doc(d, 'profiles', uid), data, { merge: true })
  } catch (err) {
    console.warn('[adminUpdateProfile] Firestore setDoc failed:', err?.message)
  }

  try {
    const existing = JSON.parse(localStorage.getItem('lamsa_all_profiles') || '[]')
    const updated = existing.map((p) => ((p.uid === uid || p.id === uid) ? { ...p, ...data } : p))
    localStorage.setItem('lamsa_all_profiles', JSON.stringify(updated))
    localStorage.setItem(`lamsa_profile_${uid}`, JSON.stringify(data))
  } catch {}
}

export async function isAdminUser(uid) {
  const { doc, getDoc } = await import('firebase/firestore')
  try {
    const d = await getDbInstance()
    const s = await getDoc(doc(d, 'admins', uid))
    return !!s.data()
  } catch { return false }
}

export async function grantAdmin(uid) {
  const { doc, setDoc } = await import('firebase/firestore')
  const d = await getDbInstance()
  return setDoc(doc(d, 'admins', uid), { granted: true, at: Date.now() })
}

export async function listProducts() {
  const { collection, query, getDocs } = await import('firebase/firestore')
  const d = await getDbInstance()
  const snap = await getDocs(query(collection(d, 'products')))
  return snap.docs.map((s) => ({ id: s.id, ...s.data() }))
}

export async function setProductActive(id, on) {
  const { doc, updateDoc } = await import('firebase/firestore')
  const d = await getDbInstance()
  return updateDoc(doc(d, 'products', id), { active: !!on })
}

export async function upsertProduct(id, data) {
  const { doc, setDoc } = await import('firebase/firestore')
  const d = await getDbInstance()
  return setDoc(doc(d, 'products', id), data, { merge: true })
}

export async function listUserOrders(uid) {
  const all = await listOrders()
  return all.filter((o) => o.uid === uid)
}
