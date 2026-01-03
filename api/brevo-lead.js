import crypto from 'node:crypto'

const json = (res, status, body) => {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

const readJsonBody = async (req) => {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const raw = Buffer.concat(chunks).toString('utf-8')
  return raw ? JSON.parse(raw) : {}
}

const normalizeEmail = (email) => String(email || '').trim().toLowerCase()

const abVariantFromEmail = (email) => {
  const hash = crypto.createHash('sha256').update(email).digest()
  const n = hash.readUInt32BE(0) % 4
  return ['A', 'B', 'C', 'D'][n]
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return json(res, 405, { error: 'Method not allowed' })
  }

  const apiKey = process.env.BREVO_API_KEY
  const listId = process.env.BREVO_MASTER_LIST_ID

  if (!apiKey || !listId) {
    return json(res, 500, {
      error: 'Brevo is not configured on the server.',
      missing: ['BREVO_API_KEY', 'BREVO_MASTER_LIST_ID'].filter((k) => !process.env[k]),
    })
  }

  let body
  try {
    body = await readJsonBody(req)
  } catch {
    return json(res, 400, { error: 'Invalid JSON body' })
  }

  const email = normalizeEmail(body.email)
  const firstName = String(body.firstName || '').trim()
  const lastName = String(body.lastName || '').trim()
  const birthDate = String(body.birthDate || '').trim() // YYYY-MM-DD
  const birthTime = String(body.birthTime || '').trim() // HH:MM
  const birthCountry = String(body.birthCountry || '').trim()
  const consent = Boolean(body.consent)

  // Core lead requirements (for segmentation + drip):
  if (!email || !email.includes('@')) return json(res, 400, { error: 'Valid email is required' })
  if (!firstName || !lastName) return json(res, 400, { error: 'First name and last name are required' })
  if (!birthDate) return json(res, 400, { error: 'Birth date is required' })
  if (!birthTime) return json(res, 400, { error: 'Birth time is required' })
  if (!birthCountry) return json(res, 400, { error: 'Birth country is required' })

  const abVariant = String(body.abVariant || abVariantFromEmail(email))
    .trim()
    .toUpperCase()

  const attributes = {
    FIRSTNAME: firstName,
    LASTNAME: lastName,

    BIRTH_DATE: birthDate,
    BIRTH_TIME: birthTime,
    BIRTH_COUNTRY: birthCountry,

    // Core “mini reading” segments
    CELTIC_TREE: body.celticMoon || '',
    LIFE_PATH: body.lifePath ?? '',
    SOUL_URGE: body.soulUrge ?? '',

    // Experiment + attribution
    AB_VARIANT: ['A', 'B', 'C', 'D'].includes(abVariant) ? abVariant : 'A',
    LEAD_SOURCE: String(body.source || 'quiz_opener').slice(0, 100),
    EMAIL_OPTIN: consent,
    LEAD_CAPTURED_AT: new Date().toISOString(),
  }

  // If consent is required for marketing in your jurisdiction, you can choose to:
  // - not add to marketing list unless consent === true
  // - or always add but tag EMAIL_OPTIN for suppression
  const listIds = consent ? [parseInt(listId, 10)] : []

  const payload = {
    email,
    attributes,
    listIds,
    updateEnabled: true, // upsert
  }

  try {
    const resp = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify(payload),
    })

    if (!resp.ok) {
      let details = null
      try {
        details = await resp.json()
      } catch {
        details = { status: resp.status }
      }
      return json(res, 502, { error: 'Brevo upsert failed', details })
    }

    // Brevo often returns empty body on success here.
    return json(res, 200, { ok: true, email, abVariant: attributes.AB_VARIANT, consent })
  } catch (e) {
    return json(res, 502, { error: 'Brevo request failed', details: String(e?.message || e) })
  }
}

