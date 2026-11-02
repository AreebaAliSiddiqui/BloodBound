import { useState } from 'react'
import { api, useLoad } from '../api'
import { Badge, Card, Err, Field, Load, Ok, Tile, fmt, useAction } from '../ui'

export function AdminDashboard() {
  const s = useLoad('/admin/dashboard')
  return (
    <>
      <h2>Admin dashboard</h2>
      <Load s={s}>{(d) => <>
        <h3>Users</h3>
        <div className="grid"><Tile label="Total" value={d.users.total} /><Tile label="Active" value={d.users.active} /><Tile label="Deactivated" value={d.users.deactivated} /><Tile label="Donors" value={d.users.donors} /><Tile label="Hospitals" value={d.users.hospital_staff} /><Tile label="Organizers" value={d.users.camp_organizers} /></div>
        <h3>Blood requests</h3>
        <div className="grid"><Tile label="Total" value={d.requests.total} /><Tile label="Pending" value={d.requests.pending} /><Tile label="Matching" value={d.requests.matching} /><Tile label="Fulfilled" value={d.requests.fulfilled} /><Tile label="Expired" value={d.requests.expired} /><Tile label="Moderated" value={d.requests.moderated} /></div>
        <h3>Camps</h3>
        <div className="grid"><Tile label="Total" value={d.camps.total} /><Tile label="Published" value={d.camps.published} /><Tile label="Ongoing" value={d.camps.ongoing} /><Tile label="Completed" value={d.camps.completed} /></div>
        <h3>Recent requests</h3>
        {d.recent_activity.requests.map((r) => <Card key={r.request_id}><div className="row"><b>{r.blood_group} at {r.hospital_name}</b><Badge tone="red">{r.status}</Badge></div><span className="muted">{fmt(r.created_at)}</span></Card>)}
      </>}</Load>
    </>
  )
}

export function AdminUsers() {
  const [q, setQ] = useState('')
  const s = useLoad('/admin/users' + (q ? `?search=${encodeURIComponent(q)}` : ''))
  const a = useAction(s.reload)
  const deactivate = (u) => {
    const reason = window.prompt('Reason for deactivation?', 'Deactivated by admin for safety/moderation.')
    if (reason !== null) a.run(() => api(`/admin/users/${u.user_id}/deactivate`, { method: 'PUT', body: { reason } }))
  }
  return (
    <>
      <h2>Users</h2>
      <Field label="Search name, email, phone or city"><input value={q} onChange={(e) => setQ(e.target.value)} /></Field>
      <Err e={a.err} /><Ok m={a.msg} />
      <Load s={s}>{(rows) => rows.map((u) => (
        <Card key={u.user_id}>
          <div className="row"><b>{u.name}</b><span><Badge>{u.role}</Badge> <Badge tone={u.is_active ? 'green' : 'red'}>{u.is_active ? 'Active' : 'Deactivated'}</Badge></span></div>
          <p className="muted">{u.email} - {u.phone}{u.city ? ` - ${u.city}` : ''}</p>
          {u.role !== 'admin' && (u.is_active
            ? <button className="btn ghost" onClick={() => deactivate(u)}>Deactivate</button>
            : <button className="btn" onClick={() => a.run(() => api(`/admin/users/${u.user_id}/reactivate`, { method: 'PUT' }))}>Reactivate</button>)}
        </Card>
      ))}</Load>
    </>
  )
}

export function AdminRequests() {
  const s = useLoad('/admin/requests')
  const a = useAction(s.reload)
  const moderate = (r, what) => {
    const reason = window.prompt(`Reason to ${what} this request?`)
    if (reason !== null) a.run(() => api(`/admin/requests/${r.request_id}/${what}`, { method: 'PUT', body: { reason } }))
  }
  return (
    <>
      <h2>Request moderation</h2>
      <Err e={a.err} /><Ok m={a.msg} />
      <Load s={s}>{(rows) => rows.map((r) => (
        <Card key={r.request_id}>
          <div className="row"><b>{r.blood_group} - {r.hospital_name}, {r.city}</b><Badge tone="red">{r.status}</Badge></div>
          <p className="muted">By {r.hospital_user_name} ({r.hospital_email}) - {r.urgency} - {r.donors_accepted}/{r.donors_alerted} accepted</p>
          {r.is_moderated && <p className="muted">Moderated: {r.moderation_reason}</p>}
          {['Pending', 'Matching'].includes(r.status) && <>
            <button className="btn ghost" onClick={() => moderate(r, 'expire')}>Expire</button>
            <button className="btn" onClick={() => moderate(r, 'remove')}>Remove</button>
          </>}
        </Card>
      ))}</Load>
    </>
  )
}
