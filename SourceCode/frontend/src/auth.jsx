import { createContext, useContext, useState } from 'react'
import { api, getAuth, setAuth } from './api'

const Ctx = createContext(null)
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getAuth())
  const login = async (email, password) => {
    const d = await api('/auth/login', { method: 'POST', body: { email, password } })
    const a = { token: d.token, role: d.role, name: d.name }
    setAuth(a); setUser(a)
  }
  const register = async (form) => {
    await api('/auth/register', { method: 'POST', body: form })
    await login(form.email, form.password)
  }
  const logout = () => { setAuth(null); setUser(null) }
  return <Ctx.Provider value={{ user, login, register, logout }}>{children}</Ctx.Provider>
}
