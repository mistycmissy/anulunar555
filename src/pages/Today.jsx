import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
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

  const now = useMemo(() => new Date(), [])
  const { phaseName } = getWeeklyTheme({}, now)
  const { lunarDay } = getMoonPhase(now)
  const { theme } = getWeeklyTheme({}, now)

  const message = useMemo(() => {
    return getDailyMicroInsight({ firstName: user?.user_metadata?.first_name }, now)
  }, [now, user?.user_metadata?.first_name])

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
            {message}
          </div>

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
          </div>
        </div>
      </div>
    </div>
  )
}

