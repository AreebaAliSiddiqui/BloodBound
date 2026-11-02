import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLoad } from '../api'
import { useAuth } from '../auth'
import { BLOOD } from '../ui'
import './landing.css'

const day = (d) => new Date(d).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })
const clock = (d) => new Date(d).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
const timeLeft = (exp) => {
  const m = Math.max(0, Math.floor((new Date(exp) - Date.now()) / 60000))
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`
}
const URGENCY = { 'Level 1 - Stat': 'LEVEL 1 - STAT', 'Level 2 - Urgent': 'LEVEL 2 - URGENT', Routine: 'ROUTINE' }

function LiveRequest() {
  const s = useLoad('/public/live-request')
  const r = s.data?.request
  return (
    <div className="lp-stage">
      <div className="lp-card lp-live">
        {s.loading && !s.data && <p className="lp-mu">Loading live request...</p>}
        {s.error && <p className="lp-mu">Live data is unavailable right now.</p>}
        {s.data && !r && (<>
          <b className="d" style={{ fontSize: 26 }}>No urgent requests right now</b>
          <p className="lp-mu">That is good news. When a hospital posts a need, it shows up here instantly.</p>
          <a className="lp-b" href="#signin">Become a donor</a>
        </>)}
        {r && (() => {
          const pct = Math.min(100, Math.round((r.donors_accepted / r.units_required) * 100))
          return (<>
            <div className="lp-row"><b style={{ letterSpacing: '.06em', fontSize: 14 }}><span className="lp-dot" />LIVE NOW</b><span className="lp-pill">{URGENCY[r.urgency] || r.urgency}</span></div>
            <div className="lp-main">
              <div className="lp-bg d">{r.blood_group}</div>
              <div><div className="d" style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.15 }}>{r.units_required} unit{r.units_required > 1 ? 's' : ''} of {r.component} needed</div>
                <div className="lp-mu" style={{ marginTop: 4 }}>{r.hospital_name}, {r.city}</div></div>
            </div>
            <div className="lp-stats">
              <div className="lp-stat"><span>NEEDED</span><b>{r.units_required} unit{r.units_required > 1 ? 's' : ''}</b></div>
              <div className="lp-stat"><span>CONFIRMED</span><b style={{ color: '#14532D' }}>{r.donors_accepted} donor{r.donors_accepted === 1 ? '' : 's'}</b></div>
              <div className="lp-stat"><span>TIME LEFT</span><b>{timeLeft(r.expires_at)}</b></div>
            </div>
            <div style={{ margin: '18px 0 20px' }}>
              <div className="lp-row" style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}><span>{r.donors_accepted} of {r.units_required} donors confirmed</span><span className="lp-mu">{pct}%</span></div>
              <div className="lp-bar"><i style={{ width: `${pct}%` }} /></div>
            </div>
            <a className="lp-b" href="#signin" style={{ display: 'block' }}>I can donate</a>
            <p className="lp-mu" style={{ fontSize: 13, margin: '14px 0 0' }}>Patient details and contact numbers stay private until a donor accepts.</p>
          </>)
        })()}
      </div>
    </div>
  )
}

function SignIn() {
  const { login } = useAuth()
  const [f, setF] = useState({ email: '', password: '' })
  const [err, setErr] = useState('')
  const submit = async (e) => {
    e.preventDefault(); setErr('')
    try { await login(f.email, f.password) } catch (x) { setErr(x.message) }
  }
  return (
    <form id="signin" className="lp-card lp-sign" onSubmit={submit}>
      <h3 className="d" style={{ fontSize: 30, margin: '0 0 4px' }}>Welcome back</h3>
      <p className="lp-mu" style={{ margin: 0 }}>We will take you to the right workspace.</p>
      <label>Email<input type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
      <label>Password<input type="password" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></label>
      {err && <p className="lp-err">{err}</p>}
      <button className="lp-b" style={{ width: '100%', marginTop: 22 }}>Sign in</button>
      <p className="lp-mu" style={{ textAlign: 'center', fontSize: 14, margin: '18px 0 0' }}>New to Bloodbound? <Link to="/register" style={{ color: 'var(--r)', fontWeight: 700 }}>Create an account</Link></p>
    </form>
  )
}

export default function Landing() {
  const camps = useLoad('/public/camps')
  return (
    <div className="lp">
      <div className="lp-w lp-nav">
        <a href="#top" className="lp-logo d"><svg width="30" height="30" viewBox="0 0 24 24" fill="#A5132E" aria-hidden="true"><path d="M12 2.5c3.5 4.6 6 7.8 6 11a6 6 0 1 1-12 0c0-3.2 2.5-6.4 6-11z" /></svg>Bloodbound</a>
        <nav><a href="#live">Live request</a><a href="#camps">Donation camps</a><a href="#how">How it works</a></nav>
        <div className="lp-btns"><a className="lp-g" href="#signin">Sign in</a><Link className="lp-b" to="/register">Join Bloodbound</Link></div>
      </div>

      <div id="live" className="lp-w lp-hero">
        <div>
          <span className="lp-pill">BLOOD DONOR AND CAMP COORDINATION</span>
          <h1 className="d">Blood, found in minutes. <span>Not hours.</span></h1>
          <p className="lp-mu lp-lead">Hospitals post an urgent need, matching donors are alerted, and donation camps fill their slots. One platform, one account.</p>
          <div className="lp-btns"><Link className="lp-b" to="/register">Become a donor</Link><a className="lp-g" href="#signin">Request blood</a></div>
        </div>
        <LiveRequest />
      </div>

      <div className="lp-band"><div className="lp-w">
        <div className="d" style={{ fontSize: 30, fontWeight: 700, maxWidth: 320, lineHeight: 1.15 }}>Know your type? Every group counts.</div>
        <div className="lp-chips">{BLOOD.map((b) => <div key={b} className="lp-chip">{b}</div>)}</div>
      </div></div>

      <div id="camps" className="lp-w lp-sec">
        <div className="lp-row" style={{ marginBottom: 32 }}>
          <div><h2 className="d">Donation camps open now</h2><p className="lp-mu" style={{ fontSize: 18, margin: 0 }}>Published by organizers. Book a slot in a minute.</p></div>
          <a className="lp-g" href="#signin">Sign in to book</a>
        </div>
        <div className="lp-grid">
          {camps.data?.map((c) => (
            <div className="lp-card" key={c.camp_id}>
              <div className="lp-row"><span className={`lp-pill ${c.slots_left > 0 ? 'ok' : ''}`}>{c.slots_left > 0 ? `${c.slots_left} SLOTS LEFT` : 'FULL'}</span><span className="lp-mu" style={{ fontSize: 14 }}>{c.city}</span></div>
              <h3 className="d" style={{ fontSize: 26, margin: '16px 0 6px' }}>{c.camp_name}</h3>
              <div className="lp-mu">{c.location_address}</div>
              <div className="lp-stats" style={{ margin: '18px 0 22px' }}>
                <div className="lp-stat"><span>DATE</span><b style={{ fontSize: 17 }}>{day(c.start_time)}</b></div>
                <div className="lp-stat"><span>TIME</span><b style={{ fontSize: 17 }}>{clock(c.start_time)} to {clock(c.end_time)}</b></div>
              </div>
              <a className="lp-b" href="#signin" style={{ display: 'block' }}>Book a slot</a>
            </div>
          ))}
          <div className="lp-card" style={{ background: 'var(--tint)', borderStyle: 'dashed', borderColor: '#F2BCC6', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h3 className="d" style={{ fontSize: 26, margin: '0 0 8px' }}>{camps.data?.length ? 'Running a camp?' : 'No camps open yet'}</h3>
            <p className="lp-mu" style={{ margin: '0 0 20px', lineHeight: 1.55 }}>Publish it and it appears here for donors straight away.</p>
            <Link className="lp-g" to="/register" style={{ alignSelf: 'flex-start' }}>Create a camp</Link>
          </div>
        </div>
        {camps.error && <p className="lp-mu">Camp list is unavailable right now.</p>}
      </div>

      <div id="how" className="lp-alt"><div className="lp-w lp-sec">
        <h2 className="d" style={{ marginBottom: 36 }}>Three steps. One platform.</h2>
        <div className="lp-grid">
          {[['1', 'Request', 'Hospital staff post the blood group, units and urgency, and share it on WhatsApp in one tap.'],
            ['2', 'Match', 'Compatible, eligible donors in the same city are alerted automatically.'],
            ['3', 'Donate', 'Donors accept, receive the hospital details, and their next eligible date is tracked.']].map(([n, t, p]) => (
            <div className="lp-card" key={n}><div className="lp-num d">{n}</div><h3 className="d" style={{ fontSize: 24, margin: '8px 0' }}>{t}</h3><p className="lp-mu" style={{ margin: 0, lineHeight: 1.55 }}>{p}</p></div>
          ))}
        </div>
      </div></div>

      <div className="lp-w lp-sec lp-split">
        <div>
          <h2 className="d">One account. <span>Every role.</span></h2>
          <p className="lp-mu" style={{ fontSize: 18, lineHeight: 1.55, margin: 0 }}>No separate portals. Sign in once and Bloodbound opens the right workspace for donors, hospitals, camp organizers and admins.</p>
        </div>
        <SignIn />
      </div>

      <div className="lp-cta"><h2 className="d">Your next donation could be someone's second chance.</h2><Link to="/register">Create your account</Link></div>
      <div className="lp-w lp-foot"><span><b style={{ color: '#111827' }}>Bloodbound</b> - Blood Donor and Donation Camp Coordination System</span><span>Software Engineering (CT-365), Group 02</span></div>
    </div>
  )
}
