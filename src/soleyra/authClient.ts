const TOKEN_KEY = 'soleyra.jwt.v1'

export type SoleyraAuthUser = {
  id: string
  email?: string
}

export const getSoleyraJwt = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export const setSoleyraJwt = (jwt: string | null) => {
  try {
    if (!jwt) localStorage.removeItem(TOKEN_KEY)
    else localStorage.setItem(TOKEN_KEY, jwt)
  } catch {
    // ignore
  }
}

export async function soleyraSignup(email: string, password: string) {
  const r = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })

  const payload = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(payload?.error || 'Signup failed')

  const jwt: string | null = payload?.jwt || null
  const user: SoleyraAuthUser | null = payload?.user || null
  setSoleyraJwt(jwt)
  return { jwt, user }
}

export async function soleyraLogin(email: string, password: string) {
  const r = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })

  const payload = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(payload?.error || 'Login failed')

  const jwt: string | null = payload?.jwt || null
  const user: SoleyraAuthUser | null = payload?.user || null
  setSoleyraJwt(jwt)
  return { jwt, user }
}

