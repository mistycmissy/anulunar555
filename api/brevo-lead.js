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

const affiliateCodeFromEmail = (email) => {
  const hash = crypto.createHash('sha256').update(String(email)).digest('hex')
  // short, share-friendly code (not secret)
  return hash.slice(0, 10).toUpperCase()
}

const getBaseUrl = () => {
  if (process.env.FRONTEND_URL) return process.env.FRONTEND_URL.replace(/\/+$/, '')
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`.replace(/\/+$/, '')
  return ''
}

const buildMiniReportHtml = ({ firstName, celticMoon, lifePath, soulUrge, abVariant, affiliateCode }) => {
  const safe = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const baseUrl = getBaseUrl()
  const shareUrl = baseUrl ? `${baseUrl}/?ref=${encodeURIComponent(affiliateCode)}` : ''

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#09071f;color:#FFFBF8;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;">
    <div style="max-width:640px;margin:0 auto;padding:28px;">
      <div style="padding:22px;border:1px solid rgba(255,255,255,0.12);border-radius:16px;background:rgba(255,255,255,0.06);">
        <h1 style="margin:0 0 8px 0;font-size:22px;line-height:1.2;">Your AnuLunar Mini Report</h1>
        <p style="margin:0 0 18px 0;opacity:0.9;">Hello ${safe(firstName)} — here’s your cosmic snapshot.</p>

        <div style="display:block;">
          <div style="margin:0 0 12px 0;padding:14px;border-radius:12px;background:rgba(255,255,255,0.06);">
            <div style="font-size:12px;opacity:0.8;">Celtic Moon Sign</div>
            <div style="font-size:18px;font-weight:700;">${safe(celticMoon || '—')}</div>
          </div>
          <div style="margin:0 0 12px 0;padding:14px;border-radius:12px;background:rgba(255,255,255,0.06);">
            <div style="font-size:12px;opacity:0.8;">Life Path</div>
            <div style="font-size:18px;font-weight:700;">${safe(lifePath || '—')}</div>
          </div>
          <div style="margin:0 0 12px 0;padding:14px;border-radius:12px;background:rgba(255,255,255,0.06);">
            <div style="font-size:12px;opacity:0.8;">Soul Urge</div>
            <div style="font-size:18px;font-weight:700;">${safe(soulUrge || '—')}</div>
          </div>
        </div>

        <p style="margin:18px 0 0 0;opacity:0.9;">
          Your A/B/C/D test path: <strong>${safe(abVariant)}</strong>
        </p>
        <p style="margin:8px 0 0 0;opacity:0.9;">
          Your Gratitude Frequency Circle referral code: <strong>${safe(affiliateCode)}</strong>
        </p>
        ${shareUrl ? `<p style="margin:8px 0 0 0;opacity:0.9;">Share link: <a href="${shareUrl}" style="color:#A5B4FC;">${shareUrl}</a></p>` : ''}
      </div>
      <p style="margin:14px 0 0 0;font-size:12px;opacity:0.7;">
        You can unsubscribe any time.
      </p>
    </div>
  </body>
</html>`
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

  const affiliateCode = String(body.affiliateCode || affiliateCodeFromEmail(email)).trim().toUpperCase()

  const attributes = {
    FIRSTNAME: firstName,
    LASTNAME: lastName,

    BIRTH_DATE: birthDate,
    BIRTH_TIME: birthTime,
    BIRTH_COUNTRY: birthCountry,

    // Core “mini reading” segments
    // Preferred (consistent) attribute name:
    CELTIC_MOON_SIGN: body.celticMoon || '',
    // Backward-compatibility (safe to remove once Brevo is migrated):
    CELTIC_TREE: body.celticMoon || '',
    LIFE_PATH: body.lifePath ?? '',
    SOUL_URGE: body.soulUrge ?? '',

    // Experiment + attribution
    AB_VARIANT: ['A', 'B', 'C', 'D'].includes(abVariant) ? abVariant : 'A',
    LEAD_SOURCE: String(body.source || 'quiz_opener').slice(0, 100),
    REF_CODE: String(body.ref || '').slice(0, 50),
    AFFILIATE_CODE: affiliateCode,
    // Contact-level tracking for “which mini-report email they received”
    LAST_MINI_REPORT_EMAIL: `MINI_REPORT_${['A', 'B', 'C', 'D'].includes(abVariant) ? abVariant : 'A'}`,
    LAST_MINI_REPORT_EMAIL_AT: new Date().toISOString(),
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

    // Optionally send mini report email (HTML) immediately.
    if (consent && body.sendEmail === true) {
      const htmlContent = buildMiniReportHtml({
        firstName,
        celticMoon: body.celticMoon,
        lifePath: body.lifePath,
        soulUrge: body.soulUrge,
        abVariant: attributes.AB_VARIANT,
        affiliateCode,
      })

      const emailResp = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'api-key': apiKey,
        },
        body: JSON.stringify({
          to: [{ email, name: `${firstName} ${lastName}`.trim() }],
          subject: `Your AnuLunar Mini Report (Life Path ${body.lifePath || ''})`.trim(),
          htmlContent,
          // Email-level tag (visible in Brevo email reporting)
          tags: [attributes.LAST_MINI_REPORT_EMAIL],
        }),
      })

      if (!emailResp.ok) {
        // Don’t fail the lead capture if email send fails — just report it.
        const details = await emailResp.json().catch(() => ({}))
        return json(res, 200, {
          ok: true,
          email,
          abVariant: attributes.AB_VARIANT,
          consent,
          affiliateCode,
          email_sent: false,
          email_error: details,
        })
      }
    }

    return json(res, 200, { ok: true, email, abVariant: attributes.AB_VARIANT, consent, affiliateCode, email_sent: consent && body.sendEmail === true })
  } catch (e) {
    return json(res, 502, { error: 'Brevo request failed', details: String(e?.message || e) })
  }
}

