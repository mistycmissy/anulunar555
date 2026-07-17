import { useEffect, useRef, useState } from 'react'
import { validateBirthData } from '../utils/cosmicBlueprint'

const STORAGE_KEY = 'anulunar.birthDataForm.v1'

const BirthDataForm = ({ onSubmit, loading = false }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
    birthTime: '',
    birthPlace: ''
  })
  const [errors, setErrors] = useState({})
  const hasHydratedRef = useRef(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') {
          setFormData((prev) => ({ ...prev, ...parsed }))
        }
      }
    } catch {
      // ignore corrupt storage
    } finally {
      hasHydratedRef.current = true
    }
  }, [])

  useEffect(() => {
    if (!hasHydratedRef.current) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData))
    } catch {
      // ignore quota/blocked storage
    }
  }, [formData])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    const validation = validateBirthData(formData)
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    onSubmit(formData)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      <div className="card">
        <h2 className="text-2xl font-display font-semibold text-cosmic-300 mb-6">
          Enter Your Birth Information
        </h2>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-2">
              First Name *
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className={`input-field ${errors.firstName ? 'border-red-500' : ''}`}
              placeholder="Enter your first name"
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-400">{errors.firstName}</p>
            )}
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-2">
              Last Name *
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className={`input-field ${errors.lastName ? 'border-red-500' : ''}`}
              placeholder="Enter your last name"
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-400">{errors.lastName}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="birthDate" className="block text-sm font-medium text-gray-300 mb-2">
            Birth Date *
          </label>
          <input
            type="date"
            id="birthDate"
            name="birthDate"
            value={formData.birthDate}
            onChange={handleChange}
            className={`input-field ${errors.birthDate ? 'border-red-500' : ''}`}
          />
          {errors.birthDate && (
            <p className="mt-1 text-sm text-red-400">{errors.birthDate}</p>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="birthTime" className="block text-sm font-medium text-gray-300 mb-2">
              Birth Time (Optional)
            </label>
            <input
              type="time"
              id="birthTime"
              name="birthTime"
              value={formData.birthTime}
              onChange={handleChange}
              className="input-field"
            />
            <p className="mt-1 text-xs text-gray-400">For more accurate Human Design analysis</p>
          </div>

          <div>
            <label htmlFor="birthPlace" className="block text-sm font-medium text-gray-300 mb-2">
              Birth Place (Optional)
            </label>
            <input
              type="text"
              id="birthPlace"
              name="birthPlace"
              value={formData.birthPlace}
              onChange={handleChange}
              className="input-field"
              placeholder="City, Country"
            />
            <p className="mt-1 text-xs text-gray-400">For geographic considerations</p>
          </div>
        </div>

        <div className="mt-8">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating Your Cosmic Blueprint...
              </span>
            ) : (
              'Generate Cosmic Blueprint'
            )}
          </button>
        </div>

        <p className="mt-4 text-xs text-gray-400 text-center">
          * Required fields. All information is processed securely and privately.
        </p>
      </div>
    </form>
  )
}

export default BirthDataForm
