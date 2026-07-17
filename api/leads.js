import { createClient } from '@supabase/supabase-js'

const json = (res, status, body) => {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

const getOrigin = (req) => {
  const origin = req.headers?.origin
  return typeof origin === 'string' ? origin : '*'
}

const withCors = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', getOrigin(req))
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

const isValidEmail = (email) => {
  if (typeof email !== 'string') return false
  const v = email.trim()
  if (v.length < 5 || v.length > 254) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

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
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE

  if (!supabaseUrl || !serviceKey) {
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

  // Honeypot: bots often fill hidden fields.
  if (body?.website) {
    json(res, 200, { ok: true })
    return
  }

  const email = typeof body?.email === 'string' ? body.email.trim() : ''
  if (!isValidEmail(email)) {
    json(res, 400, { error: 'Valid email is required' })
    return
  }

  const firstName = typeof body?.firstName === 'string' ? body.firstName.trim() : null
  const source = typeof body?.source === 'string' ? body.source.trim() : 'essence_quiz'

  const metadata =
    body?.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata)
      ? body.metadata
      : {}

  const record = {
    email,
    first_name: firstName || null,
    source,
    metadata: {
      ...metadata,
      user_agent: req.headers?.['user-agent'],
      ip: req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress
    }
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  })

  // Upsert by email so repeat “unlock” attempts don’t 500.
  const { data, error } = await supabase
    .from('leads')
    .upsert([record], { onConflict: 'email' })
    .select('id')
    .single()

  if (error) {
    json(res, 500, { error: 'Failed to save lead' })
    return
  }

  json(res, 200, { ok: true, lead_id: data?.id })
}

