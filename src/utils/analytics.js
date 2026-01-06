import { supabase, isSupabaseConfigured } from '../lib/supabase'

const SESSION_KEY = 'anulunar.sessionId.v1'
const TABLE_KEY = 'anulunar.analyticsTable.v1'

const DEFAULT_CANDIDATE_TABLES = [
  // Newer/repo schema
  'client_analytics_events',
  // Common fallbacks
  'analytics_events',
  'events'
]

const randomId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `sess_${Math.random().toString(16).slice(2)}_${Date.now()}`
}

export const getSessionId = () => {
  try {
    const existing = localStorage.getItem(SESSION_KEY)
    if (existing) return existing
    const created = randomId()
    localStorage.setItem(SESSION_KEY, created)
    return created
  } catch {
    return randomId()
  }
}

const getPreferredTable = () => {
  const fromEnv = import.meta?.env?.VITE_ANALYTICS_TABLE
  if (fromEnv && typeof fromEnv === 'string') return fromEnv

  try {
    const cached = localStorage.getItem(TABLE_KEY)
    if (cached) return cached
  } catch {
    // ignore
  }

  return null
}

const cachePreferredTable = (table) => {
  try {
    localStorage.setItem(TABLE_KEY, table)
  } catch {
    // ignore
  }
}

export const trackEvent = async (eventName, properties = {}) => {
  const payload = {
    event_name: eventName,
    session_id: getSessionId(),
    properties
  }

  if (!isSupabaseConfigured) {
    // Keep this visible in dev without failing user flows.
    if (import.meta?.env?.DEV) {
      // eslint-disable-next-line no-console
      console.debug('[analytics]', payload)
    }
    return
  }

  try {
    const preferred = getPreferredTable()
    const candidates = preferred
      ? [preferred, ...DEFAULT_CANDIDATE_TABLES.filter((t) => t !== preferred)]
      : DEFAULT_CANDIDATE_TABLES

    for (const table of candidates) {
      const { error } = await supabase.from(table).insert([payload])
      if (!error) {
        cachePreferredTable(table)
        return
      }
    }
  } catch {
    // Never block UX on analytics.
  }
}

