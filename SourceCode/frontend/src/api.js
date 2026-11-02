import { useCallback, useEffect, useState } from 'react'

const BASE = import.meta.env.VITE_API_URL || '/api'

export const getAuth = () => {
  try { return JSON.parse(localStorage.getItem('bb_auth')) } catch { return null }
}
export const setAuth = (a) =>
  a ? localStorage.setItem('bb_auth', JSON.stringify(a)) : localStorage.removeItem('bb_auth')

export async function api(path, { method = 'GET', body } = {}) {
  const a = getAuth()
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(a?.token ? { Authorization: `Bearer ${a.token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    if (res.status === 403 && /token/i.test(data.error || '')) { setAuth(null); location.href = '/login' }
    throw new Error(data.error || 'Request failed')
  }
  return data
}

export function useLoad(path) {
  const [s, setS] = useState({ data: null, error: '', loading: true })
  const reload = useCallback(() => {
    api(path).then((data) => setS({ data, error: '', loading: false }))
      .catch((e) => setS({ data: null, error: e.message, loading: false }))
  }, [path])
  useEffect(() => { reload() }, [reload])
  return { ...s, reload }
}
