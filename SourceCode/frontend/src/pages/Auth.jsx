import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import { BLOOD, Card, Err, Field, useForm } from '../ui'

export function Login() {
  const { login } = useAuth()
  const nav = useNavigate()
  const [f, set] = useForm({ email: '', password: '' })
  const [err, setErr] = useState('')
  const submit = async (e) => {
    e.preventDefault(); setErr('')
    try { await login(f.email, f.password); nav('/') } catch (x) { setErr(x.message) }
  }
  return (
    <div className="auth">
      <h1 style={{ color: 'var(--red)' }}>Bloodbound</h1>
      <p className="muted">Blood donor and donation camp coordination</p>
      <Card>
        <form onSubmit={submit}>
          <Field label="Email"><input type="email" value={f.email} onChange={set('email')} required /></Field>
          <Field label="Password"><input type="password" value={f.password} onChange={set('password')} required /></Field>
          <Err e={err} />
          <button className="btn">Log in</button>
        </form>
      </Card>
      <p className="muted">New here? <Link to="/register">Create an account</Link></p>
    </div>
  )
}

export function Register() {
  const { register } = useAuth()
  const nav = useNavigate()
  const [f, set] = useForm({ name: '', email: '', password: '', phone: '', role: 'donor', blood_group: 'O+', city: '' })
  const [err, setErr] = useState('')
  const submit = async (e) => {
    e.preventDefault(); setErr('')
    const body = { name: f.name, email: f.email, password: f.password, phone: f.phone, role: f.role }
    if (f.role === 'donor') { body.blood_group = f.blood_group; body.city = f.city }
    try { await register(body); nav('/') } catch (x) { setErr(x.message) }
  }
  return (
    <div className="auth">
      <h1 style={{ color: 'var(--red)' }}>Create account</h1>
      <Card>
        <form onSubmit={submit}>
          <Field label="I am a">
            <select value={f.role} onChange={set('role')}>
              <option value="donor">Donor</option>
              <option value="hospital_staff">Hospital staff / requester</option>
              <option value="camp_organizer">Camp organizer</option>
            </select>
          </Field>
          <Field label="Full name"><input value={f.name} onChange={set('name')} required /></Field>
          <Field label="Email"><input type="email" value={f.email} onChange={set('email')} required /></Field>
          <Field label="Phone"><input value={f.phone} onChange={set('phone')} placeholder="+923001234567" required /></Field>
          <Field label="Password"><input type="password" value={f.password} onChange={set('password')} required /></Field>
          {f.role === 'donor' && <>
            <Field label="Blood group">
              <select value={f.blood_group} onChange={set('blood_group')}>{BLOOD.map((b) => <option key={b}>{b}</option>)}</select>
            </Field>
            <Field label="City"><input value={f.city} onChange={set('city')} required /></Field>
          </>}
          <Err e={err} />
          <button className="btn">Register</button>
        </form>
      </Card>
      <p className="muted">Already registered? <Link to="/login">Log in</Link></p>
    </div>
  )
}
