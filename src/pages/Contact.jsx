import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../context/LanguageContext'
import { NfcIcon } from '../components/icons'
import { toast } from '../components/Toast'

export default function Contact() {
  const { lang } = useLang()
  const isAr = lang === 'ar'
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [sending, setSending] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) {
      toast(isAr ? 'أكمل كل الحقول' : 'Fill all fields', 'error')
      return
    }
    setSending(true)
    await new Promise((r) => setTimeout(r, 1000))
    toast(isAr ? 'تم الإرسال ✓ هنرد عليك قريب' : 'Sent ✓ We\'ll reply soon')
    setForm({ name: '', email: '', subject: '', message: '' })
    setSending(false)
  }

  return (
    <div className="pd-page">
      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="kicker">{isAr ? 'تواصل معنا' : 'Contact Us'}</span>
            <h1>{isAr ? 'احنا هنا عشانك' : 'We\'re here for you'}</h1>
            <p>{isAr ? 'سواء عندك سؤال، محتاج مساعدة، أو عندك اقتراح — ابعتلنا' : 'Whether you have a question, need help, or have a suggestion — reach out'}</p>
          </div>

          <div className="contact-grid">
            {/* Contact cards */}
            <div className="contact-cards">
              <div className="contact-card">
                <div className="contact-card-icon" style={{ background: '#25D366' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </div>
                <h3>{isAr ? 'واتساب' : 'WhatsApp'}</h3>
                <p>{isAr ? 'رد سريع على طول' : 'Instant reply'}</p>
                <a href="https://wa.me/201000000000" target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
                  {isAr ? 'ابدأ المحادثة' : 'Start chat'} →
                </a>
              </div>

              <div className="contact-card">
                <div className="contact-card-icon" style={{ background: '#EA4335' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                </div>
                <h3>{isAr ? 'البريد الإلكتروني' : 'Email'}</h3>
                <p>{isAr ? 'للأسئلة والدعم' : 'For questions & support'}</p>
                <a href="mailto:support@lamsa.ink" className="btn btn-ghost btn-sm">
                  support@lamsa.ink →
                </a>
              </div>

              <div className="contact-card">
                <div className="contact-card-icon" style={{ background: 'var(--cobalt)' }}>
                  <NfcIcon size={22} style={{ color: '#fff' }} />
                </div>
                <h3>{isAr ? 'السوشيال ميديا' : 'Social Media'}</h3>
                <p>{isAr ? 'تابعنا للعروض والتحديثات' : 'Follow us for offers & updates'}</p>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <a href="https://instagram.com/lamsa.ink" target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">Instagram</a>
                  <a href="https://x.com/lamsa_ink" target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">X</a>
                </div>
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
