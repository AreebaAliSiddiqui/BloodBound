import { useState } from 'react'

export const BLOOD = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
export const COMPONENTS = ['Whole Blood', 'Packed RBCs', 'Platelets', 'Plasma']
export const fmt = (d) => (d ? new Date(d).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '')

export const Card = ({ children, className = '' }) => <div className={`card ${className}`}>{children}</div>
export const Err = ({ e }) => (e ? <p className="msg err">{e}</p> : null)
export const Ok = ({ m }) => (m ? <p className="msg ok">{m}</p> : null)
export const Badge = ({ children, tone = '' }) => <span className={`badge ${tone}`}>{children}</span>
export const Tile = ({ label, value }) => <div className="tile"><b>{value ?? 0}</b><span className="muted">{label}</span></div>

export function Load({ s, children }) {
  if (s.loading && !s.data) return <p className="muted">Loading...</p>
  if (s.error) return <Err e={s.error} />
  return s.data ? children(s.data) : null
}

export function useAction(reload) {
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const run = async (fn) => {
    setErr(''); setMsg('')
    try { const r = await fn(); setMsg(r?.message || 'Done.'); reload && reload(); return r }
    catch (e) { setErr(e.message) }
  }
  return { msg, err, run }
}

export function useForm(init) {
  const [f, setF] = useState(init)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  return [f, set, setF]
}

export const Field = ({ label, children }) => <label>{label}{children}</label>
