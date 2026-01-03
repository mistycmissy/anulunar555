import { useMemo, useState } from 'react'
import { onboardingQuizTemplate } from './onboardingQuizTemplate'

const STORAGE_KEY = 'anulunar_onboarding_quiz_v1'

const flattenQuestions = (template) =>
  template.sections.flatMap((section) =>
    (section.questions || []).map((q) => ({ ...q, sectionId: section.id, sectionTitle: section.title })),
  )

const isAnswered = (q, value) => {
  if (q.type === 'checkbox') return Array.isArray(value) && value.length > 0
  if (q.type === 'scale') return value !== null && value !== undefined && value !== ''
  return value !== null && value !== undefined && String(value).trim().length > 0
}

const OnboardingQuiz = ({ onComplete }) => {
  const questions = useMemo(() => flattenQuestions(onboardingQuizTemplate), [])
  const total = questions.length

  const [index, setIndex] = useState(0)
  const [responses, setResponses] = useState({})
  const [submitted, setSubmitted] = useState(false)

  const current = questions[index]
  const progressPct = Math.round(((index + 1) / total) * 100)

  const updateResponse = (id, value) => {
    setResponses((prev) => ({ ...prev, [id]: value }))
  }

  const toggleCheckbox = (id, option) => {
    setResponses((prev) => {
      const currentValue = Array.isArray(prev[id]) ? prev[id] : []
      const exists = currentValue.includes(option)
      const next = exists ? currentValue.filter((x) => x !== option) : [...currentValue, option]
      return { ...prev, [id]: next }
    })
  }

  const next = () => {
    if (current?.required && !isAnswered(current, responses[current.id])) {
      alert('Please answer this question before continuing.')
      return
    }
    if (index < total - 1) setIndex((i) => i + 1)
  }

  const prev = () => {
    if (index > 0) setIndex((i) => i - 1)
  }

  const finish = () => {
    if (current?.required && !isAnswered(current, responses[current.id])) {
      alert('Please answer this question before continuing.')
      return
    }

    const payload = {
      template_id: onboardingQuizTemplate.id,
      completed_at: new Date().toISOString(),
      responses,
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    setSubmitted(true)
    onComplete?.(payload)
  }

  const renderInput = () => {
    const value = responses[current.id]

    if (current.type === 'multiple_choice') {
      return (
        <div className="space-y-3">
          {current.options.map((opt) => (
            <label key={opt} className="card p-4 flex gap-3 items-center cursor-pointer hover:border-cosmic-500/40 transition-colors">
              <input
                type="radio"
                name={current.id}
                value={opt}
                checked={value === opt}
                onChange={() => updateResponse(current.id, opt)}
              />
              <span className="text-gray-100">{opt}</span>
            </label>
          ))}
        </div>
      )
    }

    if (current.type === 'checkbox') {
      const currentValue = Array.isArray(value) ? value : []
      return (
        <div className="space-y-3">
          {current.options.map((opt) => (
            <label key={opt} className="card p-4 flex gap-3 items-center cursor-pointer hover:border-cosmic-500/40 transition-colors">
              <input
                type="checkbox"
                checked={currentValue.includes(opt)}
                onChange={() => toggleCheckbox(current.id, opt)}
              />
              <span className="text-gray-100">{opt}</span>
            </label>
          ))}
        </div>
      )
    }

    if (current.type === 'scale') {
      const min = current.scale?.min ?? 1
      const max = current.scale?.max ?? 10
      const sliderValue = value === undefined ? Math.round((min + max) / 2) : Number(value)

      return (
        <div className="card">
          <div className="flex justify-between text-sm text-gray-300 mb-3">
            <span>{current.scale?.labels?.[min] ?? min}</span>
            <span className="text-cosmic-300 font-semibold">{sliderValue}</span>
            <span>{current.scale?.labels?.[max] ?? max}</span>
          </div>
          <input
            className="w-full"
            type="range"
            min={min}
            max={max}
            value={sliderValue}
            onChange={(e) => updateResponse(current.id, e.target.value)}
          />
        </div>
      )
    }

    if (current.type === 'date') {
      return (
        <input
          className="input-field"
          type="date"
          value={value || ''}
          onChange={(e) => updateResponse(current.id, e.target.value)}
        />
      )
    }

    return (
      <input
        className="input-field"
        type="text"
        placeholder={current.placeholder || ''}
        value={value || ''}
        onChange={(e) => updateResponse(current.id, e.target.value)}
      />
    )
  }

  if (submitted) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl w-full card text-center">
          <h2 className="text-2xl font-display font-semibold text-cosmic-300 mb-3">
            Cosmic quiz complete
          </h2>
          <p className="text-gray-300 mb-6">
            Your blueprint is ready for the next step.
          </p>
          <button className="btn-primary" onClick={() => onComplete?.(JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'))}>
            Continue
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="card mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-cosmic-300 via-lunar-300 to-cosmic-300">
                {onboardingQuizTemplate.title}
              </h1>
              <p className="text-gray-300 mt-2">{onboardingQuizTemplate.description}</p>
            </div>
            <div className="text-right text-sm text-gray-300">
              <div className="font-semibold text-cosmic-300">{progressPct}%</div>
              <div>
                Question {index + 1} of {total}
              </div>
            </div>
          </div>
          <div className="mt-4 h-2 bg-white/10 rounded">
            <div className="h-2 bg-gradient-to-r from-cosmic-500 to-lunar-500 rounded" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        <div className="card">
          <div className="text-sm text-gray-400 mb-2">{current.sectionTitle}</div>
          <h2 className="text-xl font-semibold text-gray-100 mb-3">{current.question}</h2>
          {current.spiritual_note && <p className="text-sm text-lunar-300 mb-6">{current.spiritual_note}</p>}
          {renderInput()}

          <div className="flex justify-between gap-3 mt-8">
            <button className="btn-secondary" onClick={prev} disabled={index === 0}>
              Back
            </button>
            {index < total - 1 ? (
              <button className="btn-primary" onClick={next}>
                Next
              </button>
            ) : (
              <button className="btn-primary" onClick={finish}>
                Finish
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export const loadOnboardingQuiz = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export const clearOnboardingQuiz = () => {
  localStorage.removeItem(STORAGE_KEY)
}

export default OnboardingQuiz

