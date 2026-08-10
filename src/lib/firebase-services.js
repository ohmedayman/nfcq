import { getFirestore, doc, setDoc, getDoc, updateDoc, addDoc, collection, getDocs, query, orderBy } from 'firebase/firestore'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { getApp } from 'firebase/app'

let db = null
let storage = null

function getDbInstance() {
  if (!db) db = getFirestore(getApp())
  return db
}

function getStorageInstance() {
  if (!storage) storage = getStorage(getApp())
  return storage
}

export function getUserProfileRef(uid) {
  return doc(getDbInstance(), 'profiles', uid)
}

export async function initProfileIfMissing(uid, email, name) {
  const ref = getUserProfileRef(uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    await setDoc(ref, { uid, email, name, role: '', bio: '', links: [], createdAt: Date.now() })
  }
}

export async function fetchProfile(uid) {
  const snap = await getDoc(getUserProfileRef(uid))
  return snap.exists() ? snap.data() : null
}

export async function saveProfile(uid, data) {
  return updateDoc(getUserProfileRef(uid), data)
}

export async function uploadAvatar(uid, file) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const s = ref(getStorageInstance(), `avatars/${uid}.${ext}`)
  await uploadBytes(s, file)
  const url = await getDownloadURL(s)
  await updateDoc(getUserProfileRef(uid), { avatar: url })
  return url
}

export async function createOrder(uid, payload) {
  return addDoc(collection(getDbInstance(), 'orders'), {
    uid, items: payload.items, total: payload.total, currency: payload.currency,
    customer: payload.customer, createdAt: Date.now(), status: 'pending',
  })
}

export async function listOrders() {
  const snap = await getDocs(query(collection(getDbInstance(), 'orders'), orderBy('createdAt', 'desc')))
  return snap.docs.map((s) => ({ id: s.id, ...s.data() }))
}

export async function updateOrderStatus(orderId, status) {
  return updateDoc(doc(getDbInstance(), 'orders', orderId), { status })
}

export async function listProfiles() {
  const snap = await getDocs(query(collection(getDbInstance(), 'profiles')))
  return snap.docs.map((s) => ({ id: s.id, ...s.data() }))
}

export async function isAdminUser(uid) {
  try {
    const s = await getDoc(doc(getDbInstance(), 'admins', uid))
    return !!s.data()
  } catch { return false }
}

export async function grantAdmin(uid) {
  return setDoc(doc(getDbInstance(), 'admins', uid), { granted: true, at: Date.now() })
}

export async function listProducts() {
  const snap = await getDocs(query(collection(getDbInstance(), 'products')))
  return snap.docs.map((s) => ({ id: s.id, ...s.data() }))
}

export async function setProductActive(id, on) {
  return updateDoc(doc(getDbInstance(), 'products', id), { active: !!on })
}

export async function upsertProduct(id, data) {
  return setDoc(doc(getDbInstance(), 'products', id), data, { merge: true })
}

export async function listUserOrders(uid) {
  const snap = await getDocs(collection(getDbInstance(), 'orders'))
  return snap.docs
    .map((s) => ({ id: s.id, ...s.data() }))
    .filter((o) => o.uid === uid)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
}
