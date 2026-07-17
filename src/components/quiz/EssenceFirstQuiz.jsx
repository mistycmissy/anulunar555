import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { trackEvent } from '../../utils/analytics'
import { getDailyMicroInsight } from '../../utils/dailyGuidance'

const STORAGE_KEY = 'anulunar.essenceQuiz.v1'

const safeLoad = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

const safeSave = (value) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch {
    // ignore
  }
}

const apiBase = import.meta.env.VITE_API_BASE_URL || ''

export default function EssenceFirstQuiz({ onUnlocked }) {
  const [step, setStep] = useState(1)
  const [data, setData] = useState({
    firstName: '',
    currentSeason: '',
    todayNeed: '',
    email: '',
    unlocked: false
  })

  const hydratedRef = useRef(false)
  const startedRef = useRef(false)

  useEffect(() => {
    const saved = safeLoad()
    if (saved && typeof saved === 'object') {
      setStep(saved.step || 1)
      setData((prev) => ({ ...prev, ...saved.data }))
    }
    hydratedRef.current = true
  }, [])

  useEffect(() => {
    if (!hydratedRef.current) return
    safeSave({ step, data })
  }, [step, data])

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    trackEvent('essence_quiz_started', { step: 1 })
  }, [])

  const insight = useMemo(() => {
    // Intentionally short + “inevitable” tone. We reuse daily guidance engine for rhythm.
    const base = getDailyMicroInsight({ firstName: data.firstName }, new Date())
    const seasonLine = data.currentSeason
      ? ` This season is about ${data.currentSeason.toLowerCase()}—don’t outrun it.`
      : ''
    const needLine = data.todayNeed ? ` Today, choose ${data.todayNeed.toLowerCase()} first.` : ''
    return `${base}${seasonLine}${needLine}`
  }, [data.firstName, data.currentSeason, data.todayNeed])

  const canNext = () => {
    if (step === 1) return data.firstName.trim().length > 0
    if (step === 2) return Boolean(data.currentSeason)
    if (step === 3) return Boolean(data.todayNeed)
    if (step === 4) return data.email.trim().includes('@')
    return true
  }

  const next = async () => {
    if (!canNext()) return
    const nextStep = Math.min(step + 1, 4)
    setStep(nextStep)
    await trackEvent('essence_quiz_step_advanced', { step: nextStep })
    if (nextStep === 4) {
      await trackEvent('essence_quiz_reveal_viewed', {
        current_season: data.currentSeason,
        today_need: data.todayNeed
      })
    }
  }

  const back = () => setStep((s) => Math.max(1, s - 1))

  const unlock = async () => {
    if (!canNext()) return
    setData((prev) => ({ ...prev, unlocked: true }))
    await trackEvent('essence_quiz_email_unlocked', { has_email: true })

    // Public lead capture (server-side insert; no RLS changes required)
    try {
      await fetch(`${apiBase}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          firstName: data.firstName,
          source: 'essence_quiz',
          metadata: {
            currentSeason: data.currentSeason,
            todayNeed: data.todayNeed
          }
        })
      })
      await trackEvent('lead_captured', { source: 'essence_quiz' })
    } catch {
      // Never block UX on lead capture.
      await trackEvent('lead_capture_failed', { source: 'essence_quiz' })
    }

    if (typeof onUnlocked === 'function') onUnlocked({ email: data.email, firstName: data.firstName })
  }

  const reset = async () => {
    setStep(1)
    setData({
      firstName: '',
      currentSeason: '',
      todayNeed: '',
      email: '',
      unlocked: false
    })
    safeSave(null)
    await trackEvent('essence_quiz_reset', {})
  }

  return (
    <div className="max-w-2xl mx-auto card">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-display font-semibold text-cosmic-300">
            A quick initiation
          </h2>
          <p className="text-gray-400 mt-2">
            Three questions. One sentence that feels like it was meant for you.
          </p>
        </div>
        <button className="btn-secondary text-sm py-2 px-4" onClick={reset} type="button">
          Reset
        </button>
      </div>

      {/* Progress */}
      <div className="mt-6">
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-2 bg-gradient-to-r from-cosmic-400 to-lunar-300 transition-all"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
        <div className="mt-2 text-xs text-gray-500">Step {step} of 4</div>
      </div>

      {step === 1 && (
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">First name</label>
          <input
            className="input-field"
            value={data.firstName}
            onChange={(e) => setData((p) => ({ ...p, firstName: e.target.value }))}
            placeholder="How should we speak to you?"
          />
        </div>
      )}

      {step === 2 && (
        <div className="mt-6">
          <div className="text-sm font-medium text-gray-300 mb-3">What season are you in?</div>
          <div className="grid sm:grid-cols-2 gap-3">
            {['Rebuilding', 'Becoming', 'Releasing', 'Beginning again'].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setData((p) => ({ ...p, currentSeason: option }))}
                className={`p-4 rounded-lg border text-left transition-all ${
                  data.currentSeason === option
                    ? 'border-cosmic-400/70 bg-cosmic-900/30'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="text-gray-200 font-semibold">{option}</div>
                <div className="text-xs text-gray-500 mt-1">Name it once. Let it be true.</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="mt-6">
          <div className="text-sm font-medium text-gray-300 mb-3">What do you need today?</div>
          <div className="grid sm:grid-cols-2 gap-3">
            {['Clarity', 'Gentleness', 'Courage', 'Boundaries'].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setData((p) => ({ ...p, todayNeed: option }))}
                className={`p-4 rounded-lg border text-left transition-all ${
                  data.todayNeed === option
                    ? 'border-lunar-300/70 bg-cosmic-900/30'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="text-gray-200 font-semibold">{option}</div>
                <div className="text-xs text-gray-500 mt-1">One choice. One clean step.</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="mt-6">
          <div className="bg-gradient-to-r from-cosmic-900/40 to-lunar-900/20 border border-white/10 rounded-lg p-5">
            <div className="text-xs text-gray-500 mb-2">Your first transmission</div>
            <div className="text-lg text-gray-100 leading-relaxed">{insight}</div>
          </div>

          <div className="mt-5">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email to unlock your deeper blueprint
            </label>
            <input
              type="email"
              className="input-field"
              value={data.email}
              onChange={(e) => setData((p) => ({ ...p, email: e.target.value }))}
              placeholder="you@domain.com"
            />
            <p className="text-xs text-gray-500 mt-2">
              No pressure. No fear-based astrology. You can also{' '}
              <Link className="text-cosmic-300 hover:text-cosmic-200" to="/signup">
                create a free account
              </Link>{' '}
              to save everything.
            </p>
          </div>
        </div>
      )}

      <div className="mt-8 flex items-center justify-between gap-3 flex-wrap">
        <button type="button" className="btn-secondary" onClick={back} disabled={step === 1}>
          Back
        </button>

        {step < 4 ? (
          <button type="button" className="btn-primary" onClick={next} disabled={!canNext()}>
            Continue
          </button>
        ) : (
          <button type="button" className="btn-primary" onClick={unlock} disabled={!canNext()}>
            Unlock the rest
          </button>
        )}
      </div>
    </div>
  )
}

