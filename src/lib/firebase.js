import { initializeApp, getApps, getApp } from 'firebase/app'
import {
  getAuth as fbGetAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail,
} from 'firebase/auth'
import { getFirestore, doc, setDoc, getDoc, updateDoc, addDoc, collection, getDocs, query, orderBy } from 'firebase/firestore'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import firebaseConfig, { FIREBASE_READY } from '../firebase.config'

let auth = null
let db = null
let storage = null

function ensure() {
  if (!FIREBASE_READY) return false
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig)
  if (!auth) auth = fbGetAuth(app)
  if (!db) db = getFirestore(app)
  if (!storage) storage = getStorage(app)
  return true
}

export const getAuth = () => { ensure(); return auth }
export const getDb = () => { ensure(); return db }
export const getStorageRef = () => { ensure(); return storage }

// ---- Storage: avatar upload ----
export async function uploadAvatar(uid, file) {
  if (!FIREBASE_READY) throw new Error('FIREBASE_NOT_CONFIGURED')
  ensure()
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const storageRef = ref(storage, `avatars/${uid}.${ext}`)
  await uploadBytes(storageRef, file)
  const url = await getDownloadURL(storageRef)
  await updateDoc(getUserProfileRef(uid), { avatar: url })
  return url
}

// ---- Auth API ----
export const authApi = {
  isReady: () => FIREBASE_READY,
  register: (email, password) => {
    if (!FIREBASE_READY) return Promise.reject(new Error('FIREBASE_NOT_CONFIGURED'))
    ensure()
    return createUserWithEmailAndPassword(auth, email, password)
  },
  login: (email, password) => {
    if (!FIREBASE_READY) return Promise.reject(new Error('FIREBASE_NOT_CONFIGURED'))
    ensure()
    return signInWithEmailAndPassword(auth, email, password)
  },
  loginWithGoogle: () => {
    if (!FIREBASE_READY) return Promise.reject(new Error('FIREBASE_NOT_CONFIGURED'))
    ensure()
    return signInWithPopup(auth, new GoogleAuthProvider())
  },
  logout: () => {
    if (!FIREBASE_READY) return Promise.resolve()
    ensure()
    return signOut(auth)
  },
  sendPasswordReset: (email) => {
    if (!FIREBASE_READY) return Promise.reject(new Error('FIREBASE_NOT_CONFIGURED'))
    ensure()
    return sendPasswordResetEmail(auth, email)
  },
  onState: (cb) => {
    if (!FIREBASE_READY) { cb(null); return () => {} }
    ensure()
    return onAuthStateChanged(auth, cb)
  },
}

// ---- Firestore helpers ----
// Each user profile stored at: profiles/{uid}
export function getUserProfileRef(uid) {
  const d = getDb()
  return doc(d, 'profiles', uid)
}

export function initProfileIfMissing(uid, email, name) {
  if (!FIREBASE_READY) return Promise.resolve()
  const ref = getUserProfileRef(uid)
  return getDoc(ref).then((snap) => {
    if (!snap.exists()) {
      return setDoc(ref, {
        uid,
        email,
        name,
        role: '',
        bio: '',
        links: [],
        createdAt: Date.now(),
      })
    }
    return snap
  })
}

export const fetchProfile = (uid) => {
  if (!FIREBASE_READY) return Promise.resolve(null)
  return getDoc(getUserProfileRef(uid)).then((s) => (s.exists() ? s.data() : null))
}

export const saveProfile = (uid, data) => {
  if (!FIREBASE_READY) return Promise.resolve()
  return updateDoc(getUserProfileRef(uid), data)
}

// ---- Orders ----
export const createOrder = (uid, payload) => {
  const d = getDb()
  return addDoc(collection(d, 'orders'), {
    uid,
    items: payload.items,
    total: payload.total,
    currency: payload.currency,
    customer: payload.customer,
    createdAt: Date.now(),
    status: 'pending',
  })
}

// ---- Per-user public profile read (no auth required for reading) ----
export async function fetchPublic(uid) {
  if (!FIREBASE_READY) return null
  try {
    const data = await fetchProfile(uid)
    return data
  } catch {
    return null
  }
}

// ---- Admin helpers ----
export async function listOrders() {
  if (!FIREBASE_READY) return []
  const d = getDb()
  const q = query(collection(d, 'orders'), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((s) => ({ id: s.id, ...s.data() }))
}

export function updateOrderStatus(orderId, status) {
  const d = getDb()
  return updateDoc(doc(d, 'orders', orderId), { status })
}

export async function listProfiles() {
  if (!FIREBASE_READY) return []
  const d = getDb()
  const snap = await getDocs(query(collection(d, 'profiles')))
  return snap.docs.map((s) => ({ id: s.id, ...s.data() }))
}

export async function isAdminUser(uid) {
  if (!FIREBASE_READY) return false
  try {
    const s = await getDoc(doc(getDb(), 'admins', uid))
    return !!s.data()
  } catch {
    return false
  }
}

export const grantAdmin = (uid) => setDoc(doc(getDb(), 'admins', uid), { granted: true, at: Date.now() })

// ---- Product management (products/{id}) ----
export async function listProducts() {
  if (!FIREBASE_READY) return []
  const d = getDb()
  const snap = await getDocs(query(collection(d, 'products')))
  return snap.docs.map((s) => ({ id: s.id, ...s.data() }))
}

export function setProductActive(id, on) {
  const d = getDb()
  return updateDoc(doc(d, 'products', id), { active: !!on })
}

export function upsertProduct(id, data) {
  const d = getDb()
  return setDoc(doc(d, 'products', id), data, { merge: true })
}

// ---- Orders belonging to a specific user ----
export async function listUserOrders(uid) {
  if (!FIREBASE_READY) return []
  const d = getDb()
  const snap = await getDocs(collection(d, 'orders'))
  return snap.docs
    .map((s) => ({ id: s.id, ...s.data() }))
    .filter((o) => o.uid === uid)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
}

export { GoogleAuthProvider }