import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, useLoad } from '../api'
import { BLOOD, COMPONENTS, Badge, Card, Err, Field, Load, Ok, fmt, useAction, useForm } from '../ui'

export function NewRequest() {
  const nav = useNavigate()
  const [f, set] = useForm({ patient_identifier: '', blood_group: 'O-', component: 'Whole Blood', units_required: 1, urgency: 'High', city: '', hospital_name: '', hospital_address: '' })
  const [err, setErr] = useState('')
  const submit = async (e) => {
    e.preventDefault(); setErr('')
    try {
      const r = await api('/requests', { method: 'POST', body: { ...f, units_required: Number(f.units_required) } })
      nav(`/requests/${r.request.request_id}`)
    } catch (x) { setErr(x.message) }
  }
  return (
    <>
      <h2>Create emergency request</h2>
      <Card>
        <form onSubmit={submit}>
          <Field label="Patient identifier"><input value={f.patient_identifier} onChange={set('patient_identifier')} placeholder="e.g. PAT-8902" required /></Field>
          <Field label="Blood group required"><select value={f.blood_group} onChange={set('blood_group')}>{BLOOD.map((b) => <option key={b}>{b}</option>)}</select></Field>
          <Field label="Component"><select value={f.component} onChange={set('component')}>{COMPONENTS.map((c) => <option key={c}>{c}</option>)}</select></Field>
          <Field label="Units needed (1-10)"><input type="number" min="1" max="10" value={f.units_required} onChange={set('units_required')} required /></Field>
          <Field label="Urgency">
            <select value={f.urgency} onChange={set('urgency')}>
              <option value="Critical">Critical / Immediate (expires in 4h)</option>
              <option value="High">High / Urgent (12h)</option>
              <option value="Normal">Normal / Routine (24h)</option>
            </select>
          </Field>
          <Field label="City"><input value={f.city} onChange={set('city')} required /></Field>
          <Field label="Hospital name"><input value={f.hospital_name} onChange={set('hospital_name')} required /></Field>
          <Field label="Hospital address"><input value={f.hospital_address} onChange={set('hospital_address')} required /></Field>
          <Err e={err} />
          <button className="btn">Broadcast emergency alert</button>
        </form>
      </Card>
    </>
  )
}

export function MyRequests() {
  const s = useLoad('/requests')
  return (
    <>
      <div className="row"><h2>My requests</h2><Link className="btn" to="/requests/new">New request</Link></div>
      <Load s={s}>{(rows) => rows.length ? rows.map((r) => (
        <Card key={r.request_id} className={r.urgency.startsWith('Level 1') ? 'urgent' : ''}>
          <div className="row"><h3>{r.blood_group} - {r.component} x{r.units_required}</h3><Badge tone="red">{r.status}</Badge></div>
          <p className="muted">{r.urgency} - {r.hospital_name}, {r.city}</p>
          <p>{r.donors_alerted} alerted, {r.donors_accepted} accepted</p>
          <Link className="btn ghost" to={`/requests/${r.request_id}`}>Open</Link>
        </Card>
      )) : <p className="muted">No requests yet.</p>}</Load>
    </>
  )
}

export function RequestDetail() {
  const { id } = useParams()
  const s = useLoad(`/requests/${id}`)
  const a = useAction(s.reload)
  const put = (what) => a.run(() => api(`/requests/${id}/${what}`, { method: 'PUT' }))
  return (
    <>
      <Link to="/requests" className="muted">&lt; Back</Link>
      <Err e={a.err} /><Ok m={a.msg} />
      <Load s={s}>{(d) => {
        const r = d.request
        const open = ['Pending', 'Matching'].includes(r.status)
        return <>
          <Card className={r.urgency.startsWith('Level 1') ? 'urgent' : ''}>
            <div className="row"><h3>{r.blood_group} - {r.component} x{r.units_required}</h3><Badge tone="red">{r.status}</Badge></div>
            <p>{r.hospital_name}, {r.hospital_address}, {r.city}</p>
            <p className="muted">{r.urgency} - patient {r.patient_identifier} - expires {fmt(r.expires_at)}</p>
            <p>{d.donors_alerted} donors alerted, {d.donors_accepted} accepted</p>
            <a className="btn wa" href={d.whatsapp_url} target="_blank" rel="noreferrer">Share on WhatsApp</a>
            {open && <button className="btn ghost" onClick={() => put('cancel')}>Cancel request</button>}
            {r.status === 'Matching' && <button className="btn" onClick={() => put('fulfill')}>Mark fulfilled</button>}
          </Card>
          <h3>Accepted donors</h3>
          {d.accepted_donors.length ? d.accepted_donors.map((x, i) => (
            <Card key={i}><b>{x.name}</b> <Badge>{x.blood_group}</Badge><p className="muted">{x.phone}</p></Card>
          )) : <p className="muted">No donor has accepted yet.</p>}
        </>
      }}</Load>
    </>
  )
}
