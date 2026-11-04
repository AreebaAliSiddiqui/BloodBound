import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './auth'
import { BlockGrid } from './art/Blocks'
import SiteFooter from './art/SiteFooter'
import './art/art.css'

const NAV = {
  donor: [['/', 'Home'], ['/alerts', 'Alerts'], ['/camps', 'Camps'], ['/profile', 'Profile']],
  hospital_staff: [['/', 'Home'], ['/requests/new', 'New request'], ['/requests', 'My requests']],
  camp_organizer: [['/', 'My camps'], ['/organizer/new', 'New camp']],
  admin: [['/', 'Dashboard'], ['/admin/users', 'Users'], ['/admin/requests', 'Requests']],
}
const ROLE = { donor: 'Donor workspace', hospital_staff: 'Hospital workspace', camp_organizer: 'Organizer workspace', admin: 'Admin console' }
const SUB = {
  donor: 'Find alerts, book camps and keep track of your next donation.',
  hospital_staff: 'Request blood and coordinate donors in minutes.',
  camp_organizer: 'Plan camps, welcome donors and record every donation.',
  admin: 'Keep the platform safe and see how Bloodbound is doing.',
}

export default function Layout() {
  const { user, logout } = useAuth()
  const home = useLocation().pathname === '/'
  return (
    <>
      <header className="top">
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 18 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M12 2.5c3.5 4.6 6 7.8 6 11a6 6 0 1 1-12 0c0-3.2 2.5-6.4 6-11z" /></svg>
          Bloodbound
        </span>
        <span>{user.name} <button className="link" onClick={logout}>Log out</button></span>
      </header>
      <section className={`wb ${home ? 'wb-big' : ''}`}>
        <div className="wb-in">
          <div>
            <div className="wb-eyebrow">BLOODBOUND</div>
            <h1 className="wb-title">{ROLE[user.role]}</h1>
            {home && <p className="wb-sub">{SUB[user.role]}</p>}
          </div>
          <BlockGrid className="wb-art" />
        </div>
      </section>
      <main className="page"><Outlet /></main>
      <SiteFooter navPad />
      <nav className="bottom">
        {(NAV[user.role] || []).map(([to, l]) => <NavLink key={to} to={to} end>{l}</NavLink>)}
      </nav>
    </>
  )
}
