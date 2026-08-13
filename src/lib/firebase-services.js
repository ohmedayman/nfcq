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

export async function fetchProfile(identifier) {
  if (!identifier) return null
  const cleanId = String(identifier).trim().replace(/^@/, '').toLowerCase()

  let profileData = null
  
  // 1. Try local cache first by cleanId and direct identifier
  try {
    const cached = localStorage.getItem(`lamsa_profile_${cleanId}`) || localStorage.getItem(`lamsa_profile_${identifier}`)
    if (cached) profileData = JSON.parse(cached)
  } catch {}

  // Check if matches in all_profiles
  if (!profileData) {
    try {
      const all = JSON.parse(localStorage.getItem('lamsa_all_profiles') || '[]')
      const match = all.find(
        (p) => (p.username && p.username.toLowerCase() === cleanId) || p.uid === identifier || p.id === identifier
      )
      if (match) profileData = match
    } catch {}
  }

  // 2. Fetch from Firestore by document ID first
  try {
    const { getDoc, doc } = await import('firebase/firestore')
    const db = await getDbInstance()
    const snap = await getDoc(doc(db, 'profiles', identifier))
    if (snap.exists()) {
      const remote = snap.data()
      profileData = { ...(profileData || {}), ...remote, uid: identifier }
      try { localStorage.setItem(`lamsa_profile_${identifier}`, JSON.stringify(profileData)) } catch {}
      return profileData
    }
  } catch (err) {
    console.warn('[fetchProfile] direct doc lookup failed, trying query:', err?.message)
  }

  // 3. If not found by direct doc ID, query Firestore by username field
  try {
    const { collection, query, where, getDocs } = await import('firebase/firestore')
    const db = await getDbInstance()
    const q = query(collection(db, 'profiles'), where('username', '==', cleanId))
    const snap = await getDocs(q)
    if (!snap.empty) {
      const docSnap = snap.docs[0]
      const remote = docSnap.data()
      profileData = { ...(profileData || {}), ...remote, uid: docSnap.id }
      try { localStorage.setItem(`lamsa_profile_${docSnap.id}`, JSON.stringify(profileData)) } catch {}
      return profileData
    }
  } catch (err) {
    console.warn('[fetchProfile] username query error:', err?.message)
  }

  // 4. Built-in creator demo handles
  const DEMO_PROFILES = {
    'milano_eg': {
      name: 'متجر ميلانو للأزياء',
      username: 'milano_eg',
      role: 'أحدث صيحات الموضة والأزياء الرجالي',
      bio: 'متجر ميلانو - خامات قطنية بريميوم وتوصيل لجميع المحافظات 🛍️',
      theme: 'midnight-gold',
      phone: '01028707543',
      email: 'milano@lamsa.ink',
      activated: true,
      social: { instagram: 'https://instagram.com/milano', whatsapp: '201028707543', facebook: 'https://facebook.com/milano' },
      links: [
        { title: 'تشكيلة الصيف الجديدة 2026', url: 'https://lamsa.ink/store', subtitle: 'خصم 50% لفترة محدودة' },
        { title: 'طلب فوري ومحادثة واتساب', url: 'https://wa.me/201028707543', subtitle: 'خدمة عملاء 24/7' },
      ],
    },
    'dr_mohamed': {
      name: 'د. محمد أيمن',
      username: 'dr_mohamed',
      role: 'طبيب ومنصة تعليمية متكاملة',
      bio: 'شروحات وكورسات طبية مبسطة + كتب ومنصات رقمية 👨‍⚕️📚',
      theme: 'midnight-gold',
      phone: '01028707543',
      email: 'dr.mohamed@lamsa.ink',
      activated: true,
      social: { youtube: 'https://youtube.com', telegram: 'https://t.me', whatsapp: '201028707543', facebook: 'https://facebook.com' },
      links: [
        { title: 'قناتي الرسمية على يوتيوب', url: 'https://youtube.com', subtitle: '2.2M Subscribers' },
        { title: 'حجز الكورسات والكتب الطبية', url: 'https://lamsa.ink/store', subtitle: 'متوفر الشحن الفوري' },
      ],
    },
  }

  if (DEMO_PROFILES[cleanId]) {
    return DEMO_PROFILES[cleanId]
  }

  // 5. Fallback check for avatar
  try {
    const cachedAvatar = localStorage.getItem(`lamsa_avatar_${identifier}`)
    if (cachedAvatar && (!profileData || !profileData.avatar)) {
      profileData = { ...(profileData || {}), avatar: cachedAvatar }
    }
  } catch {}

  return profileData
}

export async function saveProfile(uid, data) {
  let merged = { ...data, uid, updatedAt: Date.now() }
  try {
    const cached = localStorage.getItem(`lamsa_profile_${uid}`)
    if (cached) {
      const prev = JSON.parse(cached)
      merged = { ...prev, ...data, uid, updatedAt: Date.now() }
    }
    localStorage.setItem(`lamsa_profile_${uid}`, JSON.stringify(merged))
    if (merged.username) {
      localStorage.setItem(`lamsa_profile_${merged.username.toLowerCase()}`, JSON.stringify(merged))
    }

    // Also update all_profiles list for Admin
    const all = JSON.parse(localStorage.getItem('lamsa_all_profiles') || '[]')
    const updatedAll = [merged, ...all.filter((p) => (p.uid !== uid && p.id !== uid))]
    localStorage.setItem('lamsa_all_profiles', JSON.stringify(updatedAll))
  } catch {}

  try {
    const { setDoc } = await import('firebase/firestore')
    const ref = await getUserProfileRef(uid)
    await setDoc(ref, merged, { merge: true })
  } catch (err) {
    console.warn('[saveProfile] Firestore setDoc warning:', err?.message)
  }

  return merged
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
    paymentMethod: payload.paymentMethod || 'wallet',
    walletNumber: payload.walletNumber || '',
    shipping: payload.shipping || 0,
    createdAt: Date.now(),
    status: 'pending',
  }

  let firestoreId = `LMS-${Math.floor(100000 + Math.random() * 900000)}`
  try {
    const { doc, setDoc } = await import('firebase/firestore')
    const d = await getDbInstance()
    await setDoc(doc(d, 'orders', firestoreId), orderData)
  } catch (err) {
    console.warn('[createOrder] Firestore setDoc failed, using local cache:', err?.message)
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

// ==========================================================================
//  ANALYTICS & LEAD CAPTURE SYSTEM
// ==========================================================================

export async function trackProfileView(uid) {
  if (!uid) return
  try {
    const key = `lamsa_views_${uid}`
    const cur = parseInt(localStorage.getItem(key) || '0', 10)
    localStorage.setItem(key, String(cur + 1))
  } catch {}

  try {
    const { doc, updateDoc, increment } = await import('firebase/firestore')
    const d = await getDbInstance()
    await updateDoc(doc(d, 'profiles', uid), {
      totalViews: increment(1),
      lastViewAt: Date.now(),
    })
  } catch {}
}

export async function trackLinkClick(uid, linkUrl, linkLabel) {
  if (!uid) return
  try {
    const key = `lamsa_clicks_${uid}`
    const clicks = JSON.parse(localStorage.getItem(key) || '{}')
    const itemKey = linkLabel || linkUrl
    clicks[itemKey] = (clicks[itemKey] || 0) + 1
    localStorage.setItem(key, JSON.stringify(clicks))
  } catch {}

  try {
    const { doc, updateDoc, increment } = await import('firebase/firestore')
    const d = await getDbInstance()
    await updateDoc(doc(d, 'profiles', uid), {
      totalClicks: increment(1),
    })
  } catch {}
}

export async function saveLead(profileUid, leadData) {
  const lead = {
    profileUid,
    name: leadData.name || '',
    phone: leadData.phone || '',
    email: leadData.email || '',
    note: leadData.note || '',
    createdAt: Date.now(),
  }

  // Local storage
  try {
    const key = `lamsa_leads_${profileUid}`
    const existing = JSON.parse(localStorage.getItem(key) || '[]')
    const updated = [lead, ...existing]
    localStorage.setItem(key, JSON.stringify(updated))
  } catch {}

  // Firestore
  try {
    const { collection, addDoc } = await import('firebase/firestore')
    const d = await getDbInstance()
    await addDoc(collection(d, 'leads'), lead)
  } catch (err) {
    console.warn('[saveLead] Firestore error:', err?.message)
  }

  return lead
}

export async function listLeads(profileUid) {
  let leads = []
  try {
    const { collection, query, where, getDocs } = await import('firebase/firestore')
    const d = await getDbInstance()
    const q = query(collection(d, 'leads'), where('profileUid', '==', profileUid))
    const snap = await getDocs(q)
    leads = snap.docs.map((s) => ({ id: s.id, ...s.data() }))
  } catch (err) {
    console.warn('[listLeads] Firestore read warning:', err?.message)
  }

  // Merge with local leads
  try {
    const local = JSON.parse(localStorage.getItem(`lamsa_leads_${profileUid}`) || '[]')
    const map = new Map()
    leads.forEach((l) => map.set(l.id || l.createdAt, l))
    local.forEach((l) => {
      const id = l.id || l.createdAt
      if (!map.has(id)) map.set(id, l)
    })
    leads = Array.from(map.values())
  } catch {}

  return leads.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
}

export async function getProfileAnalytics(uid) {
  let totalViews = 0
  let totalClicks = 0
  let clicksBreakdown = {}

  try {
    totalViews = parseInt(localStorage.getItem(`lamsa_views_${uid}`) || '12', 10)
    clicksBreakdown = JSON.parse(localStorage.getItem(`lamsa_clicks_${uid}`) || '{}')
    totalClicks = Object.values(clicksBreakdown).reduce((a, b) => a + b, 0) || 5
  } catch {}

  try {
    const { doc, getDoc } = await import('firebase/firestore')
    const d = await getDbInstance()
    const snap = await getDoc(doc(d, 'profiles', uid))
    if (snap.exists()) {
      const data = snap.data()
      if (data.totalViews) totalViews = Math.max(totalViews, data.totalViews)
      if (data.totalClicks) totalClicks = Math.max(totalClicks, data.totalClicks)
    }
  } catch {}

  return { totalViews, totalClicks, clicksBreakdown }
}


export async function listUserOrders(uid) {
  const all = await listOrders()
  return all.filter((o) => o.uid === uid)
}
