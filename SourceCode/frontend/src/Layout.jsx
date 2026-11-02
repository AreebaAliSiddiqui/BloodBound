import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from './auth'

const NAV = {
  donor: [['/', 'Home'], ['/alerts', 'Alerts'], ['/camps', 'Camps'], ['/profile', 'Profile']],
  hospital_staff: [['/', 'Home'], ['/requests/new', 'New request'], ['/requests', 'My requests']],
  camp_organizer: [['/', 'My camps'], ['/organizer/new', 'New camp']],
  admin: [['/', 'Dashboard'], ['/admin/users', 'Users'], ['/admin/requests', 'Requests']],
}

export default function Layout() {
  const { user, logout } = useAuth()
  return (
    <>
      <header className="top">
        <b style={{ color: 'var(--red)' }}>Bloodbound</b>
        <span className="muted">{user.name} <button className="link" onClick={logout}>Log out</button></span>
      </header>
      <main className="page"><Outlet /></main>
      <nav className="bottom">
        {(NAV[user.role] || []).map(([to, l]) => <NavLink key={to} to={to} end>{l}</NavLink>)}
      </nav>
    </>
  )
}
