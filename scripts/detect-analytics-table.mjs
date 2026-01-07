/**
 * Detect which analytics/events table exists in Supabase.
 *
 * Usage:
 *   SUPABASE_URL="https://xxxx.supabase.co" SUPABASE_ANON_KEY="ey..." node scripts/detect-analytics-table.mjs
 *
 * Notes:
 * - This does NOT insert any rows.
 * - It performs a small SELECT against candidate tables via PostgREST.
 */
const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing SUPABASE_URL and/or SUPABASE_ANON_KEY in environment.')
  process.exit(1)
}

const candidates = [
  process.env.ANALYTICS_TABLE,
  'client_analytics_events',
  'analytics_events',
  'events',
  'event',
  'tracking_events',
  'client_events'
].filter(Boolean)

const request = async (table) => {
  const url = new URL(`/rest/v1/${table}`, supabaseUrl)
  url.searchParams.set('select', 'id')
  url.searchParams.set('limit', '1')

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`
    }
  })

  return {
    table,
    status: res.status,
    ok: res.ok
  }
}

const results = []
for (const table of candidates) {
  try {
    results.push(await request(table))
  } catch (e) {
    results.push({ table, status: 'fetch_error', ok: false, error: e?.message })
  }
}

for (const r of results) {
  const exists =
    r.status === 200 ||
    r.status === 206 || // partial content
    r.status === 401 ||
    r.status === 403
      ? 'likely_exists'
      : r.status === 404
        ? 'missing'
        : 'unknown'

  console.log(`${String(r.table).padEnd(24)} -> ${String(r.status).padEnd(10)} ${exists}`)
}

const best = results.find((r) => r.ok) || results.find((r) => r.status === 401 || r.status === 403)
if (best) {
  console.log('\nSuggested config:')
  console.log(`- VITE_ANALYTICS_TABLE=${best.table}`)
}

