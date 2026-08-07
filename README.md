# Lamsa — بطاقة NFC الذكية

منصة SaaS لإصدار بطاقات NFC ذكية تحمل صفحة شخصية تفتح بلمسة واحدة على أي هاتف.

## المميزات

- 🏠 صفحة تعريفيّة (عربي + إنجليزي RTL/LTR)
- 🛒 متجر شراء بطاقات بأسعار 150 / 200 / 500 ج.م مع سلة وطلبات محفوظة في Firestore
- 🔐 تسجيل ودخول (بريد/كلمة مرور + Google) عبر Firebase Auth
- 📊 لوحة تحكم المستخدم: تعديل الملف، رفع صورة، روابط السوشيال، سجل الطلبات
- 🪪 صفحة بطاقة عامة لكل مستخدم على `/u/:uid`
- 🛡️ لوحة تحكم المشرف: نظرة عامة، الطلبات، المستخدمون، المنتجات

## التشغيل محليًا

```bash
npm install
npm run dev
```

افتح `http://localhost:5173`.

## إعداد Firebase

1. أنشئ مشروعًا في [Firebase Console](https://console.firebase.google.com).
2. فعّل **Authentication** (Email/Password + Google).
3. أنشئ قاعدة **Firestore** وأضف قواعد:
   ```js
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /profiles/{userId} {
         allow read: if true;
         allow write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```
4. انسخ مفاتيحك في `src/firebase.config.js`.
5. (اختياري) ضع بريدك في `ADMIN_EMAILS` لفتح لوحة `/admin`.

## التقنيات

React 18 · Vite · React Router · Firebase (Auth · Firestore · Storage)
