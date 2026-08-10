// ============================================================
//  LAMSA · Firebase configuration
// ============================================================

const firebaseConfig = {
  apiKey: 'AIzaSyDC9-U_FxjiFy-s6YRpnjrP0a23q4TaKzI',
  authDomain: 'lamsa-be95a.firebaseapp.com',
  projectId: 'lamsa-be95a',
  storageBucket: 'lamsa-be95a.firebasestorage.app',
  messagingSenderId: '474979012831',
  appId: '1:474979012831:web:b79294d74d81edf194196a',
  measurementId: 'G-3DVZ1QDDSB',
}

// يبقى true طالما المفاتيح موضوعة — يفعّل الاتصال الحقيقي بـ Auth و Firestore.
export const FIREBASE_READY =
  !String(firebaseConfig.apiKey).startsWith('REPLACE')

// ============================================================
//  ADMIN · أصحاب المنصة
//  ضع هنا بريدك الإلكتروني لتفتح أمامك (لوحة التحكم /admin).
//  الأمان الحقيقي يتم عبر مستند admins/{uid} في Firestore
//  (انظر "منح صلاحية مدير" أدناه) — هذا القائمة وسيلة استضافة
//  لمسح سريع دون الحاجة لرخص Firestore متقدمة.
// ============================================================
export const ADMIN_EMAILS = ['admin@lamsa.ink', 'm44408335@gmail.com']

export default firebaseConfig