export const PRODUCTS = [
  {
    id: 'classic',
    nameEn: 'Standard Card',
    nameAr: 'البطاقة القياسية',
    materialEn: 'PVC durable finish',
    materialAr: 'تشطيب PVC متين',
    price: 150,
    img: 'business-stack.webp',
    color: 'linear-gradient(135deg,#0a1e48,#061333)',
    border: '1px solid rgba(126,237,250,0.4)',
    popular: false,
    specs: { en: ['One tap sharing', 'Basic page template', '1-year warranty'], ar: ['بلمسة واحدة', 'قالب صفحة أساسي', 'ضمان سنة'] },
  },
  {
    id: 'premium',
    name: 'Premium Card',
    nameAr: 'البطاقة البريميوم',
    materialEn: 'Frosted acrylic',
    materialAr: 'أكريليك مضبب فاخر',
    price: 200,
    img: 'hero-card.webp',
    color: 'linear-gradient(135deg,#1854E8,#15D8F2)',
    popular: true,
    specs: { en: ['Custom links & socials', 'Unlimited edits', 'Priority tier'], ar: ['روابط ومنصات مخصصة', 'تعديلات غير محدودة', 'ألوان مميزة'] },
  },
  {
    id: 'executive',
    name: 'Executive Card',
    nameAr: 'البطاقة التنفيذية',
    materialEn: 'Brushed metal',
    materialAr: 'معدن مصقول',
    price: 500,
    img: 'tap-lifestyle.webp',
    color: 'linear-gradient(135deg,#7a3ff0,#1854ed)',
    popular: false,
    specs: { en: ['Luxury metal finish', 'Unique card ID', 'Lifetime edits'], ar: ['معدن فاخر', 'رقم بطاقة مميز', 'تعديلات مدى الحياة'] },
  },
]

export const CURRENCY = { ar: 'ج.م', en: 'EGP' }

export const CUSTOMER = {
  name: 'سارة أحمد',
  nameEn: 'Sarah Ahmed',
  role: 'مصممة UX · مصورة',
  roleEn: 'UX Designer · Photographer',
  bio: 'شغوفة بتصميم تجارب تستحق أن تُلمس. أشارك رحلتي، ومشاريعي، وروابطي — كلها هنا بلمسة واحدة.',
  bioEn: 'Passionate about designing experiences worth touching. Explore my journey, projects and links — all in one tap.',
  links: ['Portfolio', 'Résumé', 'Booking'],
}