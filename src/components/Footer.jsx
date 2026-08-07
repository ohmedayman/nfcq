import { Link } from 'react-router-dom'
import { useLang } from '../context/LanguageContext'
import Brand from './Brand'

export default function Footer() {
  const { text } = useLang()
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Brand light />
            <p style={{ maxWidth: 340 }}>{text.footer_about}</p>
          </div>
          <div>
            <h4>{text.footer_links}</h4>
            <Link to="/">{text.nav_home}</Link>
            <Link to="/store">{text.nav_store}</Link>
            <Link to="/nfc/demo">{text.nav_nfc}</Link>
            <Link to="/account">{text.nav_account}</Link>
          </div>
          <div>
            <h4>{text.footer_legal}</h4>
            <Link to="/account">Lamsa</Link>
          </div>
        </div>
        <div className="footer-bottom">{text.footer_rights}</div>
      </div>
    </footer>
  )
}