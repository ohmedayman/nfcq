import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useLang } from '../context/LanguageContext'
import Reveal from '../components/Reveal'

const POSTS = [
  {
    slug: 'what-is-nfc-card',
    titleEn: 'What is an NFC Card? Complete Guide 2026',
    titleAr: 'بطاقة NFC إيه؟ الدليل الكامل 2026',
    descEn: 'Everything you need to know about NFC cards — how they work, types, benefits, and how they are revolutionizing networking.',
    descAr: 'كل ما تريد معرفته عن بطاقات NFC — كيف تعمل، الأنواع، المميزات، وكيف تُحدث ثورة في التواصل.',
    date: '2026-08-10',
    readTime: '5 min',
    img: 'hero-card.webp',
    contentEn: `NFC (Near Field Communication) is a wireless technology that allows two devices to communicate when they are within 4 cm of each other. An NFC card contains a tiny chip and antenna that stores data and transmits it when tapped by a smartphone.

**How NFC Cards Work:**
1. The card contains an NFC chip (usually NTAG213 or NTAG216)
2. When a smartphone comes close, the phone's NFC reader activates the chip
3. The chip sends stored data (URL, contact info, etc.) to the phone
4. The phone processes the data and opens the link or saves the contact

**Types of NFC Cards:**
- PVC NFC Cards: Most common, durable, and affordable
- Metal NFC Cards: Premium look and feel, CNC-machined
- Paper NFC Cards: Thin and lightweight, great for events
- Wristbands/Tags: Wearable NFC solutions

**Benefits of NFC Cards:**
- Instant sharing with one tap
- No app required on the receiver's phone
- Eco-friendly (reusable, no paper waste)
- Trackable (analytics on who tapped your card)
- Editable (change your link without reprinting)`,
    contentAr: `NFC (الاتصال الميداني القريب) هو لاسلكي يسمح لأجهزتين بالتواصل عندما يكونان على بُعد 4 سم من بعضهما. تحتوي بطاقة NFC على شريحة دقيقة وهوائي يخزن البيانات ويُرسلها عند لمسها بهاتف ذكي.

**كيف تعمل بطاقات NFC:**
1. تحتوي البطاقة على شريحة NFC (عادة NTAG213 أو NTAG216)
2. عندما يأتي الهاتف القريب، يُنشّط قارئ NFC في الهاتف الشريحة
3. تُرسل الشريحة البيانات المخزنة (رابط، معلومات اتصال، إلخ) إلى الهاتف
4. يعالج الهاتف البيانات ويفتح الرابط أو يحفظ جهة الاتصال

**أنواع بطاقات NFC:**
- بطاقات PVC NFC: الأكثر شيوعاً ومتانة وأقل سعراً
- بطاقات معدنية NFC: مظهر فاخر وشعورpremium
- بطاقات ورقية NFC: رقيقة وخفيفة، مثالية للفعاليات
- أساور/ملصقات NFC: حلول NFC قابلة للارتداء

**مميزات بطاقات NFC:**
- مشاركة فورية بلمسة واحدة
- لا يحتاج تطبيق على هاتف المستقبل
- صديق للبيئة (قابل لإعادة الاستخدام، بدون نفايات ورقية)
- قابل للتتبع (تحليلات لمن لمس بطاقتك)
- قابل للتعديل (غيّر رابطك بدون إعادة طباعة)`,
  },
  {
    slug: 'digital-business-card-egypt',
    titleEn: 'Digital Business Cards in Egypt: The Future of Networking',
    titleAr: 'بطاقات العمل الرقمية في مصر: مستقبل التواصل',
    descEn: 'How Egyptian professionals are switching from paper cards to digital NFC solutions for better networking.',
    descAr: 'كيف ينتقل المحترفون المصريون من البطاقات الورقية إلى الحلول الرقمية للتواصل الأفضل.',
    date: '2026-08-08',
    readTime: '4 min',
    img: 'tap-lifestyle.webp',
    contentEn: `Egypt's business landscape is rapidly digitizing. Traditional paper business cards are being replaced by smart NFC cards and digital profiles.

**Why Egyptian Professionals Are Making the Switch:**
1. Cost-effectiveness: One card replaces hundreds of paper cards
2. Instant updates: Change your info without reprinting
3. Analytics: Track who views your profile
4. Eco-friendly: Reduce paper waste
5. Professional impression: Stand out in meetings

**Popular Use Cases in Egypt:**
- Real estate agents sharing property listings
- Doctors sharing clinic locations and booking links
- Freelancers showcasing portfolios
- Restaurants displaying menus and reviews
- Event organizers sharing schedules

**The Lamsa Advantage:**
- Arabic-first design
- Local payment methods (COD, bank transfer)
- Fast delivery across Egypt
- Free profile page included`,
    contentAr: `تتجه الأعمال في مصر نحو الرقمة بسرعة. البطاقات الورقية التقليدية يحل محلها بطاقات NFC الذكية والملفات الرقمية.

**لماذا ينتقل المحترفون المصريون:**
1. فعالية من حيث التكلفة: بطاقة واحدة تحل محل مئات البطاقات الورقية
2. تحديثات فورية: غيّر معلوماتك بدون إعادة طباعة
3. تحليلات: تتبع من يشاهد ملفك الشخصي
4. صديق للبيئة: قلل النفايات الورقية
5. انطباع احترافي: تميز في الاجتماعات

**استخدامات شائعة في مصر:**
- وسطاء عقارات يشاركون قوائم العقارات
- أطباء يشاركون مواقع العيادات وروابط الحجز
- م自由ancers يعرضون أعمالهم
- مطاعم تعرض قوائم الطعام والتقييمات
- منظموا فعاليات يشاركون الجداول

**ميزة Lamsa:**
- تصميم عربي أولاً
- طرق دفع محلية (الدفع عند الاستلام، تحويل بنكي)
- توصيل سريع في مصر
- صفحة تعريفية مجانية مشمولة`,
  },
  {
    slug: 'google-reviews-nfc',
    titleEn: 'How to Get More Google Reviews with NFC',
    titleAr: 'كيف تحصل على تقييمات جوجل أكثر بـ NFC',
    descEn: 'Boost your Google rating by 3x using NFC review stands. Customers tap and review instantly.',
    descAr: 'زِد تقييمك على جوجل 3 مرات باستخدام حاملات NFC. العملاء يضغطون ويقيّمون فوراً.',
    date: '2026-08-06',
    readTime: '3 min',
    img: 'google-reviews.avif',
    contentEn: `Google reviews are crucial for local businesses. Studies show that 88% of consumers trust online reviews as much as personal recommendations.

**The Problem with Traditional Review Collection:**
- Customers forget to leave reviews
- QR codes are hard to scan
- No reminder at the point of sale

**The NFC Solution:**
An NFC review stand placed at your counter makes it effortless:
1. Customer taps their phone on the stand
2. Your Google review page opens instantly
3. Customer leaves a review in seconds

**Results:**
- 3x more reviews compared to QR codes alone
- 50% increase in 5-star ratings
- Better local SEO ranking
- More customer trust and referrals

**Lamsa Google Reviews Stand:**
- Acrylic design (black or white)
- NFC + QR code dual technology
- No app required
- Instant setup
- Compact size (12.75 x 7.6 cm)`,
    contentAr: `تقييمات جوجل حيوية للشركات المحلية. تظهر الدراسات أن 88% من المستهلكين يثقون في التقييمات الإلكترونية كما يثقون في التوصيات الشخصية.

**المشكلة في جمع التقييمات التقليدي:**
- ينسى العملاء ترك تقييمات
- رموز QR صعبة المسح
- لا تذكير عند نقطة البيع

**حل NFC:**
حامل NFC للتقييمات يضعه على الكاونتر يجعل الأمر سهلاً:
1. يضغط العميل هاتفه على الحامل
2. تتفتح صفحة تقييم جوجل فوراً
3. يُقيّم العميل في ثوانٍ

**النتائج:**
- 3 مرات تقييمات أكثر مقارنة برموز QR وحدها
- زيادة 50% في التقييمات 5 نجوم
- تحسن في ترتيب SEO المحلي
- ثقة أكبر واحالات أكثر

**حامل تقييمات جوجل Lamsa:**
- تصميم أكريليك (أسود أو أبيض)
- NFC + رمز QR مزدوج
- بدون تطبيق
- إعداد فوري
- حجم مدمج (12.75 × 7.6 سم)`,
  },
]

export default function Blog() {
  const { lang } = useLang()
  const isAr = lang === 'ar'

  return (
    <div className="pd-page">
      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="kicker">Blog</span>
            <h1>{isAr ? 'المدونة' : 'Blog'}</h1>
            <p>{isAr ? 'نصائح ومقالات عن البطاقات الرقمية والتواصل' : 'Tips and articles about digital cards and networking'}</p>
          </div>

          <div className="blog-grid">
            {POSTS.map((post, i) => (
              <Reveal key={post.slug} delay={i * 120}>
                <Link to={`/blog/${post.slug}`} className="blog-card">
                  <div className="blog-card-img">
                    <img src={`/img/${post.img}`} alt={isAr ? post.titleAr : post.titleEn} loading="lazy" />
                  </div>
                  <div className="blog-card-body">
                    <div className="blog-card-meta">
                      <span>{post.date}</span>
                      <span>·</span>
                      <span>{isAr ? `${post.readTime} قراءة` : `${post.readTime} read`}</span>
                    </div>
                    <h3>{isAr ? post.titleAr : post.titleEn}</h3>
                    <p>{isAr ? post.descAr : post.descEn}</p>
                    <span className="blog-card-link">{isAr ? 'اقرأ المزيد' : 'Read more'} →</span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export function BlogPost() {
  const { lang } = useLang()
  const { slug } = useParams()
  const isAr = lang === 'ar'
  const post = POSTS.find((p) => p.slug === slug)

  useEffect(() => { window.scrollTo(0, 0) }, [slug])

  useEffect(() => {
    if (!post) return
    const title = isAr ? `${post.titleAr} | Lamsa Blog` : `${post.titleEn} | Lamsa Blog`
    document.title = title
    const metaDesc = document.querySelector('meta[name="description"]')
    if (metaDesc) metaDesc.setAttribute('content', isAr ? post.descAr : post.descEn)
  }, [post, isAr])

  if (!post) {
    return (
      <section className="section">
        <div className="container" style={{ textAlign: 'center' }}>
          <h2>{isAr ? 'المقال غير موجود' : 'Post not found'}</h2>
          <Link to="/blog" className="btn btn-primary" style={{ marginTop: 16 }}>{isAr ? 'العودة للمدونة' : 'Back to blog'}</Link>
        </div>
      </section>
    )
  }

  const content = isAr ? post.contentAr : post.contentEn

  return (
    <div className="pd-page">
      <section className="section">
        <div className="container" style={{ maxWidth: 800, margin: '0 auto' }}>
          <nav className="pd-breadcrumb">
            <Link to="/">{isAr ? 'الرئيسية' : 'Home'}</Link>
            <span>/</span>
            <Link to="/blog">{isAr ? 'المدونة' : 'Blog'}</Link>
            <span>/</span>
            <span className="pd-bc-current">{isAr ? post.titleAr : post.titleEn}</span>
          </nav>

          <article className="blog-article">
            <h1>{isAr ? post.titleAr : post.titleEn}</h1>
            <div className="blog-article-meta">
              <span>{post.date}</span>
              <span>·</span>
              <span>{isAr ? `${post.readTime} قراءة` : `${post.readTime} read`}</span>
            </div>
            <div className="blog-article-img">
              <img src={`/img/${post.img}`} alt={isAr ? post.titleAr : post.titleEn} loading="lazy" />
            </div>
            <div className="blog-article-content" dangerouslySetInnerHTML={{
              __html: content
                .replace(/\*\*(.*?)\*\*/g, '<h3>$1</h3>')
                .replace(/\n- /g, '\n<li>')
                .replace(/\n\d\. /g, '\n<li>')
                .replace(/\n\n/g, '</p><p>')
                .replace(/^/, '<p>')
                .replace(/$/, '</p>')
            }} />
          </article>

          <div className="blog-cta">
            <h3>{isAr ? 'جاهز تبدأ؟' : 'Ready to start?'}</h3>
            <p>{isAr ? 'اطلب بطاقة NFC وابدأ تواصلك' : 'Order your NFC card and start connecting'}</p>
            <Link to="/store" className="btn btn-primary">{isAr ? 'اطلب الآن' : 'Order now'}</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
