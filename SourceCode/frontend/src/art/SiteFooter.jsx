import { Link } from 'react-router-dom'
import { FooterScene } from './Blocks'
import './art.css'

export default function SiteFooter({ cta = false, navPad = false }) {
  return (
    <footer className="sf">
      <div className="sf-top">
        <h2 className="sf-motto">Every donation is someone's second chance.</h2>
        <p className="sf-sub">Every donor adds one more block to a stronger community.</p>
        {cta && <Link className="sf-btn" to="/register">Create your account</Link>}
      </div>
      <FooterScene />
      <div className={`sf-bar ${navPad ? 'sf-pad' : ''}`}>
        <span><b>Bloodbound</b> - Blood Donor and Donation Camp Coordination System</span>
        <span>Software Engineering (CT-365), Group 02</span>
      </div>
    </footer>
  )
}
