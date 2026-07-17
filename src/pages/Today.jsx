import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { trackEvent } from '../utils/analytics'
import { getDailyMicroInsight, getMoonPhase, getWeeklyTheme } from '../utils/dailyGuidance'

const PREF_KEY = 'anulunar.ritualFrequency.v1'

const getStoredFrequency = () => {
  try {
    const v = localStorage.getItem(PREF_KEY)
    if (v === 'daily' || v === 'lunar' || v === 'silent') return v
  } catch {
    // ignore
  }
  return 'daily'
}

const setStoredFrequency = (value) => {
  try {
    localStorage.setItem(PREF_KEY, value)
  } catch {
    // ignore
  }
}

export default function Today() {
  const { user } = useAuth()
  const [frequency, setFrequency] = useState(getStoredFrequency)
  const [copied, setCopied] = useState(false)
  const [latestBlueprint, setLatestBlueprint] = useState(null)
  const [loadingBlueprint, setLoadingBlueprint] = useState(false)
  const [ephemerisMessage, setEphemerisMessage] = useState(null)
  const [ephemerisAspect, setEphemerisAspect] = useState(null)

  const now = useMemo(() => new Date(), [])
  const celticMoonSign = latestBlueprint?.celticMoonSign?.sign
  const sunSign = latestBlueprint?.astrology?.sunSign
  const lifePath = latestBlueprint?.numerology?.lifePath?.number

  const { phaseName, theme } = getWeeklyTheme({ celticMoonSign }, now)
  const { lunarDay } = getMoonPhase(now)

  const message = useMemo(() => {
    return getDailyMicroInsight(
      {
        firstName: user?.user_metadata?.first_name,
        celticMoonSign,
        sunSign,
        lifePath
      },
      now
    )
  }, [now, user?.user_metadata?.first_name, celticMoonSign, sunSign, lifePath])

  useEffect(() => {
    const load = async () => {
      if (!user?.id) {
        setLatestBlueprint(null)
        return
      }

      setLoadingBlueprint(true)
      try {
        const { data, error } = await supabase
          .from('spiritual_reports')
          .select('synthesized_content, report_data, created_at')
          .eq('profile_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (error) throw error

        const content = data?.synthesized_content || data?.report_data || null
        setLatestBlueprint(content)

        await trackEvent('today_viewed', { has_blueprint: Boolean(content) })
      } catch (e) {
        setLatestBlueprint(null)
        await trackEvent('today_view_failed', { message: e?.message })
      } finally {
        setLoadingBlueprint(false)
      }
    }

    load()
  }, [user?.id])

  useEffect(() => {
    const loadEphemeris = async () => {
      if (!user?.id) {
        setEphemerisMessage(null)
        setEphemerisAspect(null)
        return
      }

      try {
        const { data } = await supabase.auth.getSession()
        const token = data?.session?.access_token
        if (!token) return

        const r = await fetch('/api/today-guidance', {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` }
        })

        if (!r.ok) return
        const payload = await r.json()
        if (payload?.mode === 'swiss_ephemeris' && payload?.message) {
          setEphemerisMessage(payload.message)
          setEphemerisAspect(payload.aspect || null)
        } else {
          setEphemerisMessage(null)
          setEphemerisAspect(null)
        }
      } catch {
        // ignore
      }
    }

    loadEphemeris()
  }, [user?.id])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
      await trackEvent('today_message_copied', {})
    } catch {
      // ignore
    }
  }

  const handleFrequency = async (value) => {
    setFrequency(value)
    setStoredFrequency(value)
    await trackEvent('ritual_frequency_set', { value })
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-3xl">
        <div className="card">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-display font-bold text-cosmic-300">
                Today
              </h1>
              <p className="text-gray-400 mt-2">
                {phaseName} • Lunar Day {lunarDay} • Weekly theme: {theme}
              </p>
            </div>
            <button onClick={handleCopy} className="btn-secondary text-sm py-2 px-4">
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          <div className="mt-6 text-xl text-gray-100 leading-relaxed">
            {ephemerisMessage || message}
          </div>

          {ephemerisAspect && (
            <div className="mt-3 text-xs text-gray-500">
              Swiss Ephemeris: {ephemerisAspect.transitPlanet} {ephemerisAspect.aspectName}{' '}
              {ephemerisAspect.natalPlanet}
            </div>
          )}

          <div className="mt-8 border-t border-white/10 pt-6">
            <div className="text-sm font-semibold text-gray-300">
              Ritual frequency
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Choose what feels respectful. Silent is always allowed.
            </p>

            <div className="mt-4 flex gap-3 flex-wrap">
              {[
                { key: 'daily', label: 'Daily' },
                { key: 'lunar', label: 'Lunar' },
                { key: 'silent', label: 'Silent' }
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => handleFrequency(opt.key)}
                  className={`btn-secondary ${frequency === opt.key ? 'border-cosmic-400/70' : ''}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {!user && (
              <div className="mt-6 text-sm text-gray-400">
                Want this to feel unmistakably personal?{' '}
                <Link className="text-cosmic-300 hover:text-cosmic-200" to="/signup">
                  Create a free account
                </Link>{' '}
                so we can tie “Today” to your saved blueprint.
              </div>
            )}

            {user && !loadingBlueprint && !latestBlueprint && (
              <div className="mt-6 text-sm text-gray-400">
                To personalize “Today” to your chart, generate your first blueprint on{' '}
                <Link className="text-cosmic-300 hover:text-cosmic-200" to="/">
                  Home
                </Link>
                .
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

