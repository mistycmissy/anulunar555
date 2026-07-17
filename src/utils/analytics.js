import { supabase, isSupabaseConfigured } from '../lib/supabase'

const SESSION_KEY = 'anulunar.sessionId.v1'
const TABLE_KEY = 'anulunar.analyticsTable.v1'
const STRATEGY_KEY = 'anulunar.analyticsStrategy.v1'

const DEFAULT_CANDIDATE_TABLES = [
  // Your current Supabase table
  'analytics_events',
  // Newer/repo schema
  'client_analytics_events',
  // Common fallbacks
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

const getPreferredStrategy = () => {
  try {
    const raw = localStorage.getItem(STRATEGY_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

const cachePreferredStrategy = (table, strategyId) => {
  try {
    localStorage.setItem(STRATEGY_KEY, JSON.stringify({ table, strategyId }))
  } catch {
    // ignore
  }
}

const buildCandidates = ({ eventName, sessionId, properties, userId }) => {
  const baseProps = properties && typeof properties === 'object' ? properties : {}
  const withUser = userId ? { user_id: userId } : {}

  return [
    // Most likely shape
    { strategyId: 'event_name+properties', payload: { event_name: eventName, session_id: sessionId, properties: baseProps, ...withUser } },
    // Alternate column name for event
    { strategyId: 'name+properties', payload: { name: eventName, session_id: sessionId, properties: baseProps, ...withUser } },
    { strategyId: 'event+properties', payload: { event: eventName, session_id: sessionId, properties: baseProps, ...withUser } },
    // Alternate column name for properties
    { strategyId: 'event_name+metadata', payload: { event_name: eventName, session_id: sessionId, metadata: baseProps, ...withUser } }
  ]
}

export const trackEvent = async (eventName, properties = {}) => {
  const sessionId = getSessionId()

  if (!isSupabaseConfigured) {
    // Keep this visible in dev without failing user flows.
    if (import.meta?.env?.DEV) {
      console.debug('[analytics]', { event_name: eventName, session_id: sessionId, properties })
    }
    return
  }

  try {
    const { data } = await supabase.auth.getUser()
    const userId = data?.user?.id

    const preferred = getPreferredTable()
    const candidates = preferred
      ? [preferred, ...DEFAULT_CANDIDATE_TABLES.filter((t) => t !== preferred)]
      : DEFAULT_CANDIDATE_TABLES

    const cached = getPreferredStrategy()

    for (const table of candidates) {
      // If we already know a working strategy for this table, try it first.
      if (cached?.table === table && cached?.strategyId) {
        const strategy = buildCandidates({ eventName, sessionId, properties, userId }).find(
          (c) => c.strategyId === cached.strategyId
        )
        if (strategy) {
          const { error } = await supabase.from(table).insert([strategy.payload])
          if (!error) {
            cachePreferredTable(table)
            return
          }
        }
      }

      for (const candidate of buildCandidates({ eventName, sessionId, properties, userId })) {
        const { error } = await supabase.from(table).insert([candidate.payload])
        if (!error) {
          cachePreferredTable(table)
          cachePreferredStrategy(table, candidate.strategyId)
          return
        }
      }
    }
  } catch {
    // Never block UX on analytics.
  }
}

