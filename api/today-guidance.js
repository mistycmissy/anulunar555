import { createClient } from '@supabase/supabase-js'
import process from 'node:process'
import { Buffer } from 'node:buffer'

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

const getBearer = (req) => {
  const h = req.headers?.authorization
  if (!h || typeof h !== 'string') return null
  const m = h.match(/^Bearer\s+(.+)$/i)
  return m ? m[1] : null
}

const normalizeAngle = (deg) => {
  let a = deg % 360
  if (a < 0) a += 360
  return a
}

const angularDistance = (a, b) => {
  const d = Math.abs(normalizeAngle(a) - normalizeAngle(b)) % 360
  return d > 180 ? 360 - d : d
}

const ASPECTS = [
  { name: 'conjunct', angle: 0 },
  { name: 'sextile', angle: 60 },
  { name: 'square', angle: 90 },
  { name: 'trine', angle: 120 },
  { name: 'opposite', angle: 180 }
]

const bestAspect = (distance, orb) => {
  let best = null
  for (const a of ASPECTS) {
    const delta = Math.abs(distance - a.angle)
    if (delta <= orb && (!best || delta < best.delta)) {
      best = { ...a, delta }
    }
  }
  return best
}

const pickLongitude = (planet) => {
  if (!planet || typeof planet !== 'object') return null
  const candidates = [
    planet.longitude,
    planet.lon,
    planet.ecliptic_longitude,
    planet.eclipticLongitude,
    planet.position,
    planet.degree
  ]
  for (const c of candidates) {
    const n = typeof c === 'string' ? Number(c) : c
    if (Number.isFinite(n)) return n
  }
  return null
}

const getNatalLongitudes = (fullChartJson) => {
  const planets = fullChartJson?.planets
  if (!planets || typeof planets !== 'object') return null

  const wanted = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn']
  const out = {}
  for (const name of wanted) {
    const lon = pickLongitude(planets?.[name])
    if (Number.isFinite(lon)) out[name] = lon
  }
  return Object.keys(out).length ? out : null
}

const oneSentence = ({ firstName, transitPlanet, aspectName, natalPlanet }) => {
  const addressed = firstName ? `${firstName}, ` : ''

  const aspectTone = {
    conjunct: 'it’s close. Let it be honest.',
    sextile: 'it’s supportive. Take the easy opening.',
    square: 'it’s friction. Don’t force; choose clean boundaries.',
    trine: 'it’s flowing. Let the natural path count as progress.',
    opposite: 'it’s reflective. Notice what’s being mirrored back.'
  }

  const planetTone = {
    Moon: 'Feel it first. Then decide.',
    Sun: 'Stand in what’s true. Let that lead.'
  }

  const at = aspectTone[aspectName] || 'let it be simple and real.'
  const pt = planetTone[transitPlanet] || ''

  return `${addressed}Transiting ${transitPlanet} is ${aspectName} your natal ${natalPlanet} today—${at}${pt ? ` ${pt}` : ''}`
}

export default async function handler(req, res) {
  withCors(req, res)

  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }

  if (req.method !== 'GET') {
    json(res, 405, { error: 'Method not allowed' })
    return
  }

  const token = getBearer(req)
  if (!token) {
    json(res, 401, { error: 'Missing bearer token' })
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

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  })

  const { data: userData, error: userErr } = await supabase.auth.getUser(token)
  if (userErr || !userData?.user?.id) {
    json(res, 401, { error: 'Invalid session' })
    return
  }

  const userId = userData.user.id
  const firstName = userData.user.user_metadata?.first_name || null

  // Pull latest Swiss Ephemeris natal chart output (stored by background processor)
  const { data: astro, error: astroErr } = await supabase
    .from('astrology_reports')
    .select('full_chart_json, created_at')
    .eq('profile_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (astroErr) {
    json(res, 500, { error: 'Failed to load natal chart' })
    return
  }

  const natal = getNatalLongitudes(astro?.full_chart_json)
  if (!natal) {
    json(res, 200, { ok: true, mode: 'fallback', message: null })
    return
  }

  const swissUrl = process.env.SWISS_EPHEMERIS_URL
  const swissKey = process.env.SWISS_EPHEMERIS_API_KEY
  if (!swissUrl || !swissKey) {
    json(res, 200, { ok: true, mode: 'fallback', message: null })
    return
  }

  const utcDatetime = new Date().toISOString()
  const swissInput = {
    profile_id: userId,
    utc_datetime: utcDatetime,
    latitude: 0,
    longitude: 0,
    house_system: 'Placidus',
    zodiac_system: 'Tropical',
    requested_planets: ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn']
  }

  let transitData
  try {
    const r = await fetch(swissUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${swissKey}`
      },
      body: Buffer.from(JSON.stringify(swissInput))
    })
    if (!r.ok) {
      json(res, 200, { ok: true, mode: 'fallback', message: null })
      return
    }
    transitData = await r.json()
  } catch {
    json(res, 200, { ok: true, mode: 'fallback', message: null })
    return
  }

  const transits = {}
  for (const p of swissInput.requested_planets) {
    const lon = pickLongitude(transitData?.planets?.[p])
    if (Number.isFinite(lon)) transits[p] = lon
  }

  // Find the tightest “daily” aspect — prioritize Moon then Sun.
  const priorityTransitPlanets = ['Moon', 'Sun', 'Mercury', 'Venus', 'Mars']
  const priorityNatalPlanets = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars']

  let best = null
  for (const tName of priorityTransitPlanets) {
    const tLon = transits[tName]
    if (!Number.isFinite(tLon)) continue

    const orb = tName === 'Moon' ? 5 : 3
    for (const nName of priorityNatalPlanets) {
      const nLon = natal[nName]
      if (!Number.isFinite(nLon)) continue

      const dist = angularDistance(tLon, nLon)
      const aspect = bestAspect(dist, orb)
      if (!aspect) continue

      const candidate = {
        transitPlanet: tName,
        natalPlanet: nName,
        aspectName: aspect.name,
        exactness: aspect.delta
      }

      if (!best || candidate.exactness < best.exactness) best = candidate
    }

    // If we found a strong lunar aspect, stop early for “today”.
    if (best && best.transitPlanet === 'Moon') break
  }

  if (!best) {
    json(res, 200, { ok: true, mode: 'fallback', message: null })
    return
  }

  const message = oneSentence({
    firstName,
    transitPlanet: best.transitPlanet,
    aspectName: best.aspectName,
    natalPlanet: best.natalPlanet
  })

  json(res, 200, {
    ok: true,
    mode: 'swiss_ephemeris',
    message,
    aspect: best,
    generated_at: utcDatetime
  })
}

