import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../context/LanguageContext'
import { FlaticonWhatsApp, FlaticonMail, FlaticonSocial, FlaticonHeadset } from '../components/icons'
import { toast } from '../components/Toast'
import { sanitizeText, getWhatsAppDeepLink } from '../lib/utils'

export default function Contact() {
  const { lang } = useLang()
  const isAr = lang === 'ar'
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '', hp: '' })
  const [sending, setSending] = useState(false)
  const [lastSent, setLastSent] = useState(0)

  async function handleSubmit(e) {
    e.preventDefault()
    // Anti-bot honeypot check
    if (form.hp) {
      console.warn('Bot detected via honeypot')
      return setForm({ name: '', email: '', subject: '', message: '', hp: '' })
    }

    const now = Date.now()
    if (now - lastSent < 15000) {
      return toast(isAr ? 'يرجى الانتظار 15 ثانية قبل إرسال رسالة جديدة' : 'Please wait 15s before sending another message', 'info')
    }

    if (!form.name || !form.email || !form.message) {
      toast(isAr ? 'أكمل كل الحقول' : 'Fill all fields', 'error')
      return
    }

    setSending(true)
    setLastSent(now)
    await new Promise((r) => setTimeout(r, 800))
    toast(isAr ? 'تم الإرسال بأمان ✓ هنرد عليك خلال دقائق' : 'Message sent securely ✓ We will reply shortly')
    setForm({ name: '', email: '', subject: '', message: '', hp: '' })
    setSending(false)
  }

  return (
    <div className="pd-page">
      <section className="section">
        <div className="container">
          <nav className="pd-breadcrumb">
            <Link to="/">{isAr ? 'الرئيسية' : 'Home'}</Link>
            <span>/</span>
            <span className="pd-bc-current">{isAr ? 'تواصل معنا' : 'Contact'}</span>
          </nav>
          <div className="section-head">
            <span className="kicker">{isAr ? 'خدمة العملاء والدعم الفني' : 'Customer Support & Help'}</span>
            <h1>{isAr ? 'نحن هنا لمساعدتك في أي وقت' : 'We\'re here to help anytime'}</h1>
            <p>{isAr ? 'اختر وسيلة التواصل الأنسب لك أو أرسل رسالتك وسنرد فوراً' : 'Choose your preferred channel or send us a message below'}</p>
          </div>

          <div className="contact-grid">
            {/* Contact cards with Official Flaticon Luxury Icons */}
            <div className="contact-cards">
              <div className="contact-card">
                <div className="contact-card-icon-wrap">
                  <FlaticonWhatsApp size={42} />
                </div>
                <h3>{isAr ? 'واتساب الرسمي' : 'Official WhatsApp'}</h3>
                <p>{isAr ? 'محادثة فورية وسريعة' : 'Instant live chat 24/7'}</p>
                <a href={getWhatsAppDeepLink('201028707543', isAr ? 'مرحباً خدمة عملاء لمسة NFC 👋' : 'Hello Lamsa NFC support 👋')} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                  {isAr ? 'محادثة مباشرة (01028707543)' : 'Start Chat (01028707543)'} →
                </a>
              </div>

              <div className="contact-card">
                <div className="contact-card-icon-wrap">
                  <FlaticonMail size={42} />
                </div>
                <h3>{isAr ? 'البريد الإلكتروني' : 'Official Email'}</h3>
                <p>{isAr ? 'للشركات والمبيعات والدعم' : 'For business & technical support'}</p>
                <a href="mailto:support@lamsa.ink" className="btn btn-ghost btn-sm">
                  support@lamsa.ink →
                </a>
              </div>

              <div className="contact-card">
                <div className="contact-card-icon-wrap">
                  <FlaticonSocial size={42} />
                </div>
                <h3>{isAr ? 'قنوات التواصل' : 'Social Channels'}</h3>
                <p>{isAr ? 'العروض والتحديثات الحصرية' : 'Exclusive offers & updates'}</p>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <a href="https://instagram.com/lamsa.ink" target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">Instagram</a>
                  <a href="https://x.com/lamsa_ink" target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">X</a>
                </div>
              </div>

              <div className="contact-card">
                <div className="contact-card-icon-wrap">
                  <FlaticonHeadset size={42} />
                </div>
                <h3>{isAr ? 'خدمة العملاء' : '24/7 Hotline'}</h3>
                <p>{isAr ? 'استشارات وشحن سريع' : 'Consultations & quick order help'}</p>
                <a href="tel:01028707543" className="btn btn-ghost btn-sm">
                  01028707543 →
                </a>
              </div>
            </div>

            {/* Contact form */}
            <div className="contact-form-wrap">
              <h2>{isAr ? 'ابعتلنا رسالة' : 'Send us a message'}</h2>
              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="contact-form-row">
                  <div className="field">
                    <label>{isAr ? 'الاسم' : 'Name'}</label>
                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={isAr ? 'محمد' : 'John'} required />
                  </div>
                  <div className="field">
                    <label>{isAr ? 'الإيميل' : 'Email'}</label>
                    <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@email.com" required dir="ltr" style={{ textAlign: 'left' }} />
                  </div>
                </div>
                {/* Anti-spam honeypot */}
                <div style={{ display: 'none' }} aria-hidden="true">
                  <input
                    type="text"
                    name="company_hp"
                    tabIndex={-1}
                    autoComplete="off"
                    value={form.hp}
                    onChange={(e) => setForm({ ...form, hp: e.target.value })}
                  />
                </div>

                <div className="field">
                  <label>{isAr ? 'الموضوع' : 'Subject'}</label>
                  <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
                    <option value="">{isAr ? 'اختر موضوع' : 'Choose a subject'}</option>
                    <option value="order">{isAr ? 'سؤال عن طلب' : 'Order question'}</option>
                    <option value="support">{isAr ? 'مساعدة تقنية' : 'Technical support'}</option>
                    <option value="bulk">{isAr ? 'طلب بالجملة' : 'Bulk order'}</option>
                    <option value="other">{isAr ? 'أخرى' : 'Other'}</option>
                  </select>
                </div>
                <div className="field">
                  <label>{isAr ? 'الرسالة' : 'Message'}</label>
                  <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={5} placeholder={isAr ? 'اكتب رسالتك هنا…' : 'Write your message here…'} required />
                </div>
                <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={sending}>
                  {sending ? '…' : (isAr ? 'إرسال الرسالة' : 'Send message')}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
