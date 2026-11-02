import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, useLoad } from '../api'
import { Badge, COMPONENTS, Card, Err, Field, Load, Ok, fmt, useAction, useForm } from '../ui'

export function MyCamps() {
  const s = useLoad('/camps/mine')
  const a = useAction(s.reload)
  const put = (id, what) => a.run(() => api(`/camps/${id}/${what}`, { method: 'PUT' }))
  return (
    <>
      <div className="row"><h2>My camps</h2><Link className="btn" to="/organizer/new">New camp</Link></div>
      <Err e={a.err} /><Ok m={a.msg} />
      <Load s={s}>{(rows) => rows.length ? rows.map((c) => (
        <Card key={c.camp_id}>
          <div className="row"><h3>{c.camp_name}</h3><Badge tone="red">{c.status}</Badge></div>
          <p>{c.location_address}, {c.city}</p>
          <p className="muted">{fmt(c.start_time)} to {fmt(c.end_time)}</p>
          <p>{c.booked}/{c.max_capacity} booked - {c.checked_in} checked in - {c.units_collected}/{c.target_units} units</p>
          {c.status === 'Draft' && <button className="btn" onClick={() => put(c.camp_id, 'publish')}>Publish</button>}
          {['Draft', 'Published'].includes(c.status) && <button className="btn ghost" onClick={() => put(c.camp_id, 'cancel')}>Cancel camp</button>}
          <Link className="btn ghost" to={`/organizer/${c.camp_id}`}>Roster</Link>
        </Card>
      )) : <p className="muted">You have not created any camps yet.</p>}</Load>
    </>
  )
}

export function NewCamp() {
  const nav = useNavigate()
  const [f, set] = useForm({ camp_name: '', location_address: '', city: '', start_time: '', end_time: '', max_capacity: 50, target_units: 50 })
  const [err, setErr] = useState('')
  const submit = async (e) => {
    e.preventDefault(); setErr('')
    try {
      await api('/camps', { method: 'POST', body: {
        ...f, start_time: new Date(f.start_time).toISOString(), end_time: new Date(f.end_time).toISOString(),
        max_capacity: Number(f.max_capacity), target_units: Number(f.target_units) } })
      nav('/')
    } catch (x) { setErr(x.message) }
  }
  return (
    <>
      <h2>Create donation camp</h2>
      <Card>
        <form onSubmit={submit}>
          <Field label="Camp name (5-100 characters)"><input value={f.camp_name} onChange={set('camp_name')} required /></Field>
          <Field label="Location address"><input value={f.location_address} onChange={set('location_address')} required /></Field>
          <Field label="City"><input value={f.city} onChange={set('city')} required /></Field>
          <Field label="Starts"><input type="datetime-local" value={f.start_time} onChange={set('start_time')} required /></Field>
          <Field label="Ends"><input type="datetime-local" value={f.end_time} onChange={set('end_time')} required /></Field>
          <Field label="Max capacity (10-1000)"><input type="number" value={f.max_capacity} onChange={set('max_capacity')} required /></Field>
          <Field label="Target units"><input type="number" value={f.target_units} onChange={set('target_units')} required /></Field>
          <Err e={err} />
          <button className="btn">Save as draft</button>
        </form>
      </Card>
    </>
  )
}

export function Roster() {
  const { id } = useParams()
  const s = useLoad(`/attendance/camps/${id}/roster`)
  const a = useAction(s.reload)
  const [comp, setComp] = useState('Whole Blood')
  const post = (what, body) => a.run(() => api(`/attendance/camps/${id}/${what}`, { method: 'POST', body }))
  return (
    <>
      <Link to="/" className="muted">&lt; Back</Link>
      <h2>Camp roster</h2>
      <Err e={a.err} /><Ok m={a.msg} />
      <Field label="Blood component for donations"><select value={comp} onChange={(e) => setComp(e.target.value)}>{COMPONENTS.map((c) => <option key={c}>{c}</option>)}</select></Field>
      <Load s={s}>{(rows) => rows.length ? rows.map((r) => (
        <Card key={r.appointment_id}>
          <div className="row"><b>{r.name}</b><Badge>{r.blood_group}</Badge></div>
          <p className="muted">{r.phone} - slot {fmt(r.slot_time)}</p>
          {r.donated ? <Badge tone="green">Donation recorded</Badge>
            : r.attended ? <button className="btn" onClick={() => post('donation', { appointment_id: r.appointment_id, component: comp })}>Record donation</button>
            : <button className="btn" onClick={() => post('checkin', { appointment_id: r.appointment_id })}>Check in</button>}
        </Card>
      )) : <p className="muted">No donors have booked yet.</p>}</Load>
    </>
  )
}
