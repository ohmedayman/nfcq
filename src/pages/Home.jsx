import { Link } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { useLang } from '../context/LanguageContext'
import { PRODUCTS, CURRENCY } from '../data/content'
import Reveal from '../components/Reveal'
import { NfcIcon, IconUser, IconRefresh, IconShield, IconZap } from '../components/icons'

function useCountUp(target, duration = 1800) {
  const [val, setVal] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true
        const start = performance.now()
        const tick = (now) => {
          const p = Math.min((now - start) / duration, 1)
          const ease = 1 - Math.pow(1 - p, 3)
          setVal(Math.round(ease * target))
          if (p < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }
    }, { threshold: 0.3 })
    io.observe(el)
    return () => io.disconnect()
  }, [target, duration])
  return { ref, val }
}

function StatCounter({ value, suffix = '', label }) {
  const { ref, val } = useCountUp(value)
  return (
    <div className="stat" ref={ref}>
      <b>{val.toLocaleString()}{suffix}</b>
      <span>{label}</span>
    </div>
  )
}

export default function Home() {
  const { text, lang } = useLang()
  const isAr = lang === 'ar'

  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="container hero-grid">
          <div className="hero-content">
            <Reveal>
              <span className="hero-badge"><NfcIcon size={16} /> {text.tagline}</span>
            </Reveal>
            <Reveal delay={80}>
              <h1>
                {text.hero_title.split(' ')[0]}{' '}
                <span className="grad">{text.hero_title.split(' ').slice(1).join(' ')}</span>
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="lead">{text.hero_subtitle}</p>
            </Reveal>
            <Reveal delay={240}>
              <div className="hero-actions">
                <Link to="/store" className="btn btn-primary">{text.hero_cta}</Link>
                <Link to="/nfc/demo" className="btn btn-ghost">{text.hero_cta2}</Link>
              </div>
            </Reveal>
            <Reveal delay={320}>
              <div className="hero-trust-row">
                <div className="hero-avatars">
                  {[1,2,3,4].map(i => <span key={i} className="hero-av" style={{marginLeft: i>1?'-10px':0, zIndex:5-i}}>{String.fromCharCode(64+i)}</span>)}
                </div>
                <span className="hero-trust-text">{isAr ? 'أكثر من 2,000 مستخدم نشط' : '2,000+ active users'}</span>
              </div>
            </Reveal>
          </div>

          <div className="hero-visual">
            <Reveal delay={200}>
              <div className="hero-img-wrap">
                <img src="/img/hero-card.webp" alt="Lamsa NFC card" loading="eager" />
              </div>
            </Reveal>
            <div className="float-chip fc-1">
              <span className="pulse" />
              NFC — <b>{isAr ? 'لمسة واحدة' : 'One tap'}</b>
            </div>
            <div className="float-chip fc-2">
              <NfcIcon size="1.3em" />
              <span>{isAr ? 'توصّل فوراً' : 'Instant connect'}<br /><b>{isAr ? '+10K بطاقة صادرة' : '10K+ cards issued'}</b></span>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="stats">
        <div className="container stats-grid">
          <StatCounter value={1000000} suffix="+" label={text.stat_cards} />
          <StatCounter value={70} suffix="+" label={text.stat_countries} />
          <StatCounter value={1} suffix="s" label={text.stat_seconds} />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="kicker">{isAr ? 'كيف تعمل' : 'How it works'}</span>
            <h2>{isAr ? 'ثلاث خطوات بسيطة' : 'Three simple steps'}</h2>
            <p>{isAr ? 'من التسجيل للبطاقة في دقائق' : 'From signup to card in minutes'}</p>
          </div>
          <div className="steps">
            {[
              { n: '01', icon: <IconUser size={26} />, t: isAr ? 'سجّل حسابك' : 'Create account', d: isAr ? 'سجّل مجاناً ببريدك أو حسابك على Google' : 'Sign up free with email or Google' },
              { n: '02', icon: <IconZap size={26} />, t: isAr ? 'صمّم بطاقتك' : 'Design your card', d: isAr ? 'أضف روابطك وصورك وبياناتك من لوحة التحكم' : 'Add your links, photos and info from the dashboard' },
              { n: '03', icon: <NfcIcon size={26} />, t: isAr ? 'ادفع وابدأ' : 'Tap & connect', d: isAr ? 'اطلب البطاقة المادية أو شارك الرابط الرقمي فوراً' : 'Order the physical card or share the digital link instantly' },
            ].map((s, i) => (
              <Reveal key={i} delay={i * 120}>
                <div className="step-card">
                  <div className="step-num">{s.n}</div>
                  <div className="step-icon">{s.icon}</div>
                  <h3>{s.t}</h3>
                  <p>{s.d}</p>
                  {i < 2 && <div className="step-arrow">→</div>}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="section section-alt">
        <div className="container">
          <div className="section-head">
            <span className="kicker">Lamsa</span>
            <h2>{text.features_title}</h2>
            <p>{text.features_subtitle}</p>
          </div>
          <div className="feats">
            {[
              { i: <NfcIcon size={22} />, t: text.f1_t, d: text.f1_d },
              { i: <IconUser size={22} />, t: text.f2_t, d: text.f2_d },
              { i: <IconShield size={22} />, t: text.f3_t, d: text.f3_d },
              { i: <IconRefresh size={22} />, t: text.f4_t, d: text.f4_d },
            ].map((f, k) => (
              <Reveal key={k} delay={k * 100}>
                <div className="feat">
                  <div className="feat-emblem">{f.i}</div>
                  <h3>{f.t}</h3>
                  <p>{f.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* SHOWCASE — detail */}
      <section className="section">
        <div className="container split">
          <Reveal>
            <div className="split-media"><img src="/img/card-detail.webp" alt="Lamsa card detail" /></div>
          </Reveal>
          <Reveal delay={150}>
            <div className="split-body">
              <span className="kicker">Lamsa</span>
              <h3>{isAr ? 'بطاقة بحجم حلمك، ورد بجودة لا تنكر' : 'A card built around you'}</h3>
              <p>{isAr ? 'سيرتك، روابطك، وصورك — كل شيء في تصميم واحد يفتح بلمسة هاتفك.' : 'Your story, links and media in a single tap-ready design.'}</p>
              <div className="point-list">
                <div className="point"><span className="tick">✓</span><div><b>{isAr ? 'تحرير لحظي' : 'Live editing'}</b><span>{isAr ? 'غيّر أي معلومة من حسابك' : 'Change anything from your account'}</span></div></div>
                <div className="point"><span className="tick">✓</span><div><b>{isAr ? 'روابط مذهلة' : 'Beautiful links'}</b><span>{isAr ? 'سوشيال ميديا وأعمالك في مكان واحد' : 'Socials and portfolio in one place'}</span></div></div>
                <div className="point"><span className="tick">✓</span><div><b>{isAr ? 'تحليلات' : 'Analytics'}</b><span>{isAr ? 'اعرف من بتفاعل مع صفحتك' : 'Know who engages with your page'}</span></div></div>
              </div>
              <Link to="/store" className="btn btn-primary">{text.buy}</Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* SHOWCASE — lifestyle */}
      <section className="section section-alt">
        <div className="container split split-reverse">
          <Reveal delay={150}>
            <div className="split-body">
              <span className="kicker">Lamsa</span>
              <h3>{isAr ? 'لمسة واحدة تكفيك' : 'Business in one tap'}</h3>
              <p>{isAr ? 'من فكرة إلى شركة — منصة SaaS تجمع بطاقاتك وأعمالك وفريقك.' : 'From idea to company — manage cards, teams and growth all in one.'}</p>
              <div className="point-list">
                <div className="point"><span className="tick">✓</span><div><b>{isAr ? 'مثالي لـ' : 'Built for'}</b><span>{isAr ? 'رواد أعمال، محترفون، فرق' : 'Founders, professionals, teams'}</span></div></div>
                <div className="point"><span className="tick">✓</span><div><b>{isAr ? 'قابل للتوسع' : 'Scale ready'}</b><span>{isAr ? 'أصدار وطبع بحجم التيريات' : 'Issue cards at any volume'}</span></div></div>
              </div>
              <Link to="/account" className="btn btn-primary">{isAr ? 'ابدأ مجاناً' : 'Start free'}</Link>
            </div>
          </Reveal>
          <Reveal>
            <div className="split-media"><img src="/img/tap-lifestyle.webp" alt="lamsa tap" /></div>
          </Reveal>
        </div>
      </section>

      {/* PRICING */}
      <section className="section" id="store">
        <div className="container">
          <div className="section-head">
            <span className="kicker">Pricing</span>
            <h2>{text.store_title}</h2>
            <p>{text.store_subtitle}</p>
          </div>
          <div className="store-grid">
            {PRODUCTS.map((p) => {
              const ar = isAr
              return (
                <Reveal key={p.id}>
                  <div className={`pcard${p.popular ? ' hot' : ''}`}>
                    {p.popular && <span className="pop">{ar ? 'الأكثر مبيعًا' : 'Popular'}</span>}
                    <div className="pcard-visual" style={{ background: p.color }}>
                      <img src={`/img/${p.img || 'card-detail.png'}`} alt={p.nameEn} />
                    </div>
                    <div className="pcard-body">
                      <h3>{ar ? p.nameAr : p.nameEn}</h3>
                      <p className="pcard-material">{ar ? p.materialAr : p.materialEn}</p>
                      <ul className="specs">
                        {(ar ? p.specs.ar : p.specs.en).map((s, i) => (
                          <li key={i}><span className="i">✓</span>{s}</li>
                        ))}
                      </ul>
                      <div className="price"><b>{p.price}</b><small>{CURRENCY[lang]}</small></div>
                      <Link to="/store" className="btn btn-primary btn-block">{text.buy}</Link>
                    </div>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="section section-alt">
        <div className="container">
          <div className="section-head">
            <span className="kicker">{isAr ? 'آراء عملائنا' : 'Testimonials'}</span>
            <h2>{isAr ? 'يثقون بنا' : 'Trusted by people who care'}</h2>
            <p>{isAr ? 'قصص حقيقية من مستخدمين غيروا طريقة تواصلهم.' : 'Real stories from people who changed how they connect.'}</p>
          </div>
          <div className="tests">
            {[
              { n: isAr ? 'أحمد سمير' : 'Ahmed Samir', r: isAr ? 'رائد أعمال' : 'Entrepreneur', co: 'TechStart', c: isAr ? 'وشّي شغلي مع كل عميل — لمسة واحدة ووصفت أعمالي كلها.' : 'Card changed how clients reach my work — one tap and everything is there.' },
              { n: isAr ? 'سارة حسن' : 'Sarah Hassan', r: isAr ? 'مصممة UX' : 'UX Designer', co: 'Freelance', c: isAr ? 'التصميم فخم والبطاقة حصلت عليها. الكل بيسأل عنها!' : 'The design is premium and everyone asks about it!' },
              { n: isAr ? 'محمد علي' : 'Mohamed Ali', r: isAr ? 'مدير تنفيذي' : 'CEO', co: 'Nile Corp', c: isAr ? 'سهولة وصول غيرت تعاملنا. رابط واحد في كل اجتماع.' : 'Streamlined and impressive at every meeting.' },
            ].map((x, i) => (
              <Reveal key={i} delay={i * 120}>
                <div className="test">
                  <div className="stars">★★★★★</div>
                  <p className="quote">"{x.c}"</p>
                  <div className="who">
                    <div className="av" style={{ background: 'var(--grad)' }}>{x.n.charAt(0)}</div>
                    <div>
                      <b>{x.n}</b>
                      <span>{x.r} · {x.co}</span>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="kicker">FAQ</span>
            <h2>{isAr ? 'الأسئلة الشائعة' : 'Frequently asked questions'}</h2>
            <p>{isAr ? 'كل ما تريد معرفته عن Lamsa.' : 'Everything you need to know about Lamsa.'}</p>
          </div>
          <div className="faq">
            {[
              { q: isAr ? 'كيف تعمل البطاقة؟' : 'How does the card work?', a: isAr ? 'تحمل البطاقة شريحة NFC تتصل برابط صفحتك. ضعها على هاتف أي شخص وتفتح صفحتك فوراً.' : 'The card carries an NFC chip linked to your page link. Tap it to any phone and your page opens instantly.' },
              { q: isAr ? 'هل أحتاج تطبيقاً؟' : 'Do I need an app?', a: isAr ? 'لا، كل هاتف ذكي يقرأ NFC بدون أي تطبيقات — الصفحة تُفتح في المتصفح مباشرة.' : 'No app needed — every smartphone reads NFC, opening your page in the browser.' },
              { q: isAr ? 'هل يمكنني تعديل البيانات لاحقاً؟' : 'Can I update it later?', a: isAr ? 'نعم، تعدّل صفحتك من لوحة التحكم في أي وقت ولن تضطر لإعادة طباعة البطاقة.' : 'Yes — edit everything from your dashboard anytime, without reprinting.' },
              { q: isAr ? 'ما مدة التوصيل؟' : 'Delivery time?', a: isAr ? 'الإصدار الرقمي فوري، والبطاقة المادية تصلك خلال 3–5 أيام.' : 'Digital issue is instant; the physical card arrives in 3–5 days.' },
            ].map((f, i) => <FaqItem key={i} q={f.q} a={f.a} />)}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-band">
        <div className="container cta-inner">
          <span className="kicker">Lamsa</span>
          <h2>{isAr ? 'جاهز تشارك قِصتك؟' : 'Ready to tell your story?'}</h2>
          <p>{isAr ? 'أنشئ حسابك، اطلب بطاقة، وابدأ تواصل بلمسة واحدة.' : 'Create an account, order a card, and start connecting.'}</p>
          <div className="hero-actions" style={{ justifyContent: 'center' }}>
            <Link to="/account" className="btn btn-primary">{text.nav_account}</Link>
            <Link to="/store" className="btn btn-ghost">{text.buy}</Link>
          </div>
        </div>
      </section>
    </>
  )
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`faq-item ${open ? 'open' : ''}`}>
      <button className="faq-q" onClick={() => setOpen(!open)}>
        <span>{q}</span>
        <span className="chev">▾</span>
      </button>
      <div className="faq-a" style={{ maxHeight: open ? 200 : 0 }}>
        <div>{a}</div>
      </div>
    </div>
  )
}
