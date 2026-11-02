import { Link } from 'react-router-dom'
import { useLoad } from '../api'
import { useAuth } from '../auth'
import { Badge, Card, Load, Tile, fmt } from '../ui'
import { AdminDashboard } from './admin'
import { MyCamps } from './organizer'

function DonorHome({ name }) {
  const rem = useLoad('/donors/me/reminders')
  const alerts = useLoad('/requests/alerts')
  const bookings = useLoad('/bookings/mine')
  return (
    <>
      <h2>Welcome back, {name}!</h2>
      <Load s={rem}>{(r) => (
        <Card>
          <Badge tone={r.eligible ? 'green' : 'red'}>{r.eligible ? 'Eligible to donate' : 'Not eligible yet'}</Badge>
          <p>{r.reminder}</p>
          {r.last_donation_date && <p className="muted">Last donation: {r.last_donation_date}</p>}
        </Card>
      )}</Load>
      <Load s={alerts}>{(rows) => rows.length > 0 && (
        <Card className="urgent"><b>{rows.length} emergency alert(s) matched to you</b><br /><Link className="btn" to="/alerts">View and accept</Link></Card>
      )}</Load>
      <div className="row"><Link className="btn" to="/camps">Find donation camps</Link><Link className="btn ghost" to="/profile">My profile</Link></div>
      <h3>Upcoming camp bookings</h3>
      <Load s={bookings}>{(rows) => {
        const up = rows.filter((b) => !b.attended)
        return up.length ? up.map((b) => <Card key={b.appointment_id}><b>{b.camp_name}</b><p className="muted">{fmt(b.slot_time)}</p></Card>) : <p className="muted">No upcoming bookings.</p>
      }}</Load>
    </>
  )
}

function HospitalHome({ name }) {
  const s = useLoad('/requests')
  return (
    <>
      <h2>Hello, {name}</h2>
      <Load s={s}>{(rows) => (
        <div className="grid">
          <Tile label="Total requests" value={rows.length} />
          <Tile label="Open" value={rows.filter((r) => ['Pending', 'Matching'].includes(r.status)).length} />
          <Tile label="Fulfilled" value={rows.filter((r) => r.status === 'Fulfilled').length} />
        </div>
      )}</Load>
      <p><Link className="btn" to="/requests/new">Create emergency request</Link><Link className="btn ghost" to="/requests">View my requests</Link></p>
    </>
  )
}

export default function Home() {
  const { user } = useAuth()
  if (user.role === 'donor') return <DonorHome name={user.name} />
  if (user.role === 'hospital_staff') return <HospitalHome name={user.name} />
  if (user.role === 'camp_organizer') return <MyCamps />
  return <AdminDashboard />
}
