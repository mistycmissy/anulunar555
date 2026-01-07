import { createClient } from '@supabase/supabase-js'

const json = (res, status, body) => {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

const withCors = (req, res) => {
  const origin = typeof req.headers?.origin === 'string' ? req.headers.origin : '*'
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Vary', 'Origin')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

const readBody = async (req) => {
  if (req.body && typeof req.body === 'object') return req.body
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) return {}
  return JSON.parse(raw)
}

const isValidEmail = (email) => typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

export default async function handler(req, res) {
  withCors(req, res)

  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }

  if (req.method !== 'POST') {
    json(res, 405, { error: 'Method not allowed' })
    return
  }

  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    json(res, 500, { error: 'Server not configured' })
    return
  }

  let body
  try {
    body = await readBody(req)
  } catch {
    json(res, 400, { error: 'Invalid JSON body' })
    return
  }

  const email = typeof body?.email === 'string' ? body.email.trim() : ''
  const password = typeof body?.password === 'string' ? body.password : ''

  if (!isValidEmail(email)) {
    json(res, 400, { error: 'Valid email is required' })
    return
  }
  if (!password || password.length < 6) {
    json(res, 400, { error: 'Password must be at least 6 characters' })
    return
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  })

  const { data, error } = await supabase.auth.signUp({
    email,
    password
  })

  if (error) {
    json(res, 400, { error: error.message })
    return
  }

  const jwt = data?.session?.access_token || null
  const user = data?.user || null

  json(res, 200, { jwt, user })
}

