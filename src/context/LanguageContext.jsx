import { createContext, useContext, useEffect, useState } from 'react'

const LanguageContext = createContext(null)

export const STRINGS = {
  ar: {
    dir: 'rtl',
    lang: 'الأرابية',
    tagline: 'لمستك — تفتح عالمك',
    brand: 'Lamsa',
    nav_home: 'الرئيسية',
    nav_store: 'المتجر',
    nav_nfc: 'بطاقتي',
    nav_account: 'حسابي',
    nav_signin: 'تسجيل الدخول',
    hero_title: 'شارك نفسك بلمسة واحدة',
    hero_subtitle:
      'بطاقة NFC ذكية تحمل ملفك الشخصي — سيرتك الذاتية، روابطك، وصفحتك الخاصة. نقّر، وتصل لكل من تريد.',
    hero_cta: 'تسوّق بطاقاتك',
    hero_cta2: 'شاهد كيف تعمل',
    stat_cards: 'بطاقات صادرة',
    stat_countries: 'دولة حول العالم',
    stat_seconds: 'ثوانٍ لتشارك ملفك',
    features_title: 'ليش Lamsa؟',
    features_subtitle: 'كل ما تحتاجه لتترك اتصالًا يدوم.',
    f1_t: 'بلمسة واحدة',
    f1_d: 'نقّر البطاقة على أي هاتف وتنفتح صفحتك فورًا من غير برامج.',
    f2_t: 'صفحة تخصّك أنت',
    f2_d: 'تحكم كامل: صورك، سيرتك، روابطك، ومنصاتك كلها في صفحة واحدة.',
    f3_t: 'تصميم يليق بيك',
    f3_d: 'مواد فاخرة وتصميم أنيق يترك انطباعًا قويًا.',
    f4_t: 'تحكم لحظي',
    f4_d: 'حدّث أي معلومة من حسابك ولا تعيد طباعة البطاقة.',
    store_title: 'اختر بطاقتك',
    store_subtitle: 'مواد وأسعار سما ترضيك — شراء وسرعة في التوصيل.',
    buy: 'اشترِ الآن',
    from: 'يبدأ من',
    account_title: 'أنشئ حسابك',
    account_register: 'إنشاء حساب جديد',
    account_login: 'تسجيل الدخول',
    have_account: 'لديك حساب؟ سجّل دخولك',
    no_account: 'ليس لديك حساب؟ أنشئ واحدًا',
    account_go: 'متابعة',
    nfc_title: 'صفحة بطاقتك',
    footer_about: 'منصة NFC ذكية تساعدك لترك اتصال رقمي يدوم بلمسة واحدة.',
    footer_links: 'روابط',
    footer_legal: 'قانوني',
    footer_rights: '© 2026 Lamsa. جميع الحقوق محفوظة.',
    demo_user: 'سارة أحمد',
    demo_role: 'مصممة UX · القاهرة',
  },
  en: {
    dir: 'ltr',
    lang: 'English',
    tagline: 'Your touch — opens your world',
    brand: 'Lamsa',
    nav_home: 'Home',
    nav_store: 'Store',
    nav_nfc: 'My Card',
    nav_account: 'Account',
    nav_signin: 'Sign in',
    hero_title: 'Share yourself with one tap',
    hero_subtitle: 'Smart NFC cards carrying your digital profile — CV, links and your own page. Tap, and connect.',
    hero_cta: 'Shop your card',
    hero_cta2: 'See how it works',
    stat_cards: 'Cards issued',
    stat_countries: 'Countries',
    stat_seconds: 'Seconds to share',
    f_title: 'Why Lamsa?',
    f_subtitle: 'Everything you need to make a lasting connection.',
    f1_t: 'One tap',
    f1_d: 'Tap your card to any phone and your page opens instantly.',
    f2_t: 'Your own page',
    f2_d: 'Full control: CV, socials, links and media on one page.',
    f3_t: 'Design that fits you',
    f3_d: 'Premium materials and a professional look that impresses.',
    f4_t: 'Live control',
    f4_d: 'Update anything from your account — no need to reprint.',
    store_title: 'Choose your card',
    store_subtitle: 'Premium materials and prices — fast shipping.',
    buy: 'Buy now',
    price_from: 'From',
    account_title: 'Create your account',
    account_register: 'Create new account',
    account_login: 'Sign in',
    have_account: 'Already have an account? Sign in',
    no_account: 'No account yet? Create one',
    account_next: 'Continue',
    nfc_title: 'Your card page',
    footer_about: 'A smart NFC platform that lets you leave a lasting digital impression with one tap.',
    footer_links: 'Links',
    footer_legal: 'Legal',
    footer_rights: '© 2026 Lamsa. All rights reserved.',
    copy_user: 'Sarah Ahmed',
    copy_role: 'UX Designer · Photographer',
  },
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('lamsa-lang') || 'ar')

  useEffect(() => {
    localStorage.setItem('lamsa-lang', lang)
    document.documentElement.lang = lang
    document.documentElement.dir = STRINGS[lang].dir
  }, [lang])

  return (
    <LanguageContext.Provider value={{ lang, setLang, text: STRINGS[lang], other: STRINGS[lang === 'ar' ? 'en' : 'ar'] }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLang() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLang must be used within LanguageProvider')
  return ctx
}