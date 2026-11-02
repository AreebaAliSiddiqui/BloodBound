import { useState } from 'react'
import { api, useLoad } from '../api'
import { BLOOD, Badge, Card, Err, Field, Load, Ok, fmt, useAction, useForm } from '../ui'

export function Alerts() {
  const s = useLoad('/requests/alerts')
  const a = useAction(s.reload)
  const post = (id, what) => a.run(() => api(`/requests/${id}/${what}`, { method: 'POST' }))
  return (
    <>
      <h2>Emergency alerts</h2>
      <Err e={a.err} /><Ok m={a.msg} />
      <Load s={s}>{(rows) => rows.length ? rows.map((r) => (
        <Card key={r.request_id} className={r.urgency.startsWith('Level 1') ? 'urgent' : ''}>
          <div className="row"><h3>{r.blood_group} - {r.component}</h3><Badge tone="red">{r.urgency}</Badge></div>
          <p>{r.units_required} unit(s) needed at {r.hospital_name}, {r.city}</p>
          <p className="muted">Expires {fmt(r.expires_at)}</p>
          {r.response_status === 'Accepted' ? <>
            <p><b>Address:</b> {r.hospital_address}<br /><b>Contact:</b> {r.hospital_contact}</p>
            <button className="btn ghost" onClick={() => post(r.request_id, 'withdraw')}>Withdraw</button>
          </> : <>
            <p className="muted">Hospital address and contact unlock after you accept.</p>
            <button className="btn" onClick={() => post(r.request_id, 'accept')}>Accept request</button>
          </>}
        </Card>
      )) : <p className="muted">No active alerts matched to you right now.</p>}</Load>
    </>
  )
}

export function Camps() {
  const [city, setCity] = useState('')
  const s = useLoad('/camps' + (city ? `?city=${encodeURIComponent(city)}` : ''))
  const mine = useLoad('/bookings/mine')
  const a = useAction(() => { s.reload(); mine.reload() })
  return (
    <>
      <h2>Donation camps</h2>
      <Err e={a.err} /><Ok m={a.msg} />
      <Field label="Filter by city"><input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Karachi" /></Field>
      <Load s={s}>{(rows) => rows.length ? rows.map((c) => (
        <Card key={c.camp_id}>
          <div className="row"><h3>{c.camp_name}</h3><Badge tone={c.slots_left > 0 ? 'green' : 'red'}>{c.slots_left > 0 ? `${c.slots_left} slots left` : 'Full'}</Badge></div>
          <p>{c.location_address}, {c.city}</p>
          <p className="muted">{fmt(c.start_time)} to {fmt(c.end_time)} - by {c.organizer_name}</p>
          <button className="btn" disabled={c.slots_left <= 0}
            onClick={() => a.run(() => api('/bookings', { method: 'POST', body: { camp_id: c.camp_id } }))}>Book slot</button>
        </Card>
      )) : <p className="muted">No open camps found.</p>}</Load>
      <h3>My bookings</h3>
      <Load s={mine}>{(rows) => rows.length ? rows.map((b) => (
        <Card key={b.appointment_id}>
          <div className="row"><b>{b.camp_name}</b><Badge tone={b.attended ? 'green' : ''}>{b.attended ? 'Attended' : 'Booked'}</Badge></div>
          <p className="muted">{fmt(b.slot_time)} - {b.location_address}, {b.city}</p>
          {!b.attended && <button className="btn ghost" onClick={() => a.run(() => api(`/bookings/${b.camp_id}`, { method: 'DELETE' }))}>Cancel booking</button>}
        </Card>
      )) : <p className="muted">You have no bookings yet.</p>}</Load>
    </>
  )
}

function ProfileForm({ p, onSaved }) {
  const [f, set] = useForm({ blood_group: p.blood_group, city: p.city || '', last_donation_date: (p.last_donation_date || '').slice(0, 10) })
  const a = useAction(onSaved)
  const save = (e) => {
    e.preventDefault()
    const body = { blood_group: f.blood_group, city: f.city }
    if (f.last_donation_date) body.last_donation_date = f.last_donation_date
    a.run(() => api('/donors/me', { method: 'PUT', body }))
  }
  return (
    <form onSubmit={save}>
      <Field label="Blood group"><select value={f.blood_group} onChange={set('blood_group')}>{BLOOD.map((b) => <option key={b}>{b}</option>)}</select></Field>
      <Field label="City"><input value={f.city} onChange={set('city')} required /></Field>
      <Field label="Last donation date"><input type="date" value={f.last_donation_date} onChange={set('last_donation_date')} /></Field>
      <Err e={a.err} /><Ok m={a.msg} />
      <button className="btn">Save profile</button>
    </form>
  )
}

export function Profile() {
  const s = useLoad('/donors/me')
  return (
    <>
      <h2>My profile</h2>
      <Load s={s}>{(p) => <>
        <Card>
          <div className="row"><b>{p.name}</b><Badge tone={p.eligibility.eligible ? 'green' : 'red'}>{p.eligibility.eligible ? 'Eligible to donate' : 'Not eligible yet'}</Badge></div>
          <p className="muted">{p.email} - {p.phone}</p>
          {p.eligibility.reminder && <p>{p.eligibility.reminder}</p>}
          {!p.eligibility.eligible && <p className="muted">Next eligible date: {p.eligibility.next_eligible_date}</p>}
        </Card>
        <Card><ProfileForm key={p.last_donation_date + p.city + p.blood_group} p={p} onSaved={s.reload} /></Card>
      </>}</Load>
    </>
  )
}
