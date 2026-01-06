import { supabase, isSupabaseConfigured } from '../lib/supabase'

const SESSION_KEY = 'anulunar.sessionId.v1'

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
    await supabase.from('client_analytics_events').insert([payload])
  } catch {
    // Never block UX on analytics.
  }
}

