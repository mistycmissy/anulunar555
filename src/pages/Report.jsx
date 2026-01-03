import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import CosmicBlueprintReport from '../components/CosmicBlueprintReport'

const Report = () => {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [report, setReport] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const { data, error } = await supabase.from('cosmic_reports').select('*').eq('id', id).single()
        if (error) throw error
        setReport(data)
      } catch (e) {
        setError(e?.message || 'Failed to load report')
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-cosmic-300 text-xl">Loading report…</div>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="min-h-screen py-10 px-4">
        <div className="max-w-3xl mx-auto card">
          <p className="text-red-300 mb-4">{error || 'Report not found'}</p>
          <Link to="/dashboard" className="btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  // Full blueprint reports already match the CosmicBlueprintReport shape.
  if (report.report_data?.personalInfo && report.report_data?.numerology) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="container mx-auto">
          <Link to="/dashboard" className="text-cosmic-300 hover:text-cosmic-400 transition-colors">
            ← Back to Dashboard
          </Link>
          <div className="mt-4">
            <CosmicBlueprintReport blueprint={report.report_data} />
          </div>
        </div>
      </div>
    )
  }

  // Mini report view
  if (report.report_data?.kind === 'mini_report') {
    const computed = report.report_data?.computed || {}
    return (
      <div className="min-h-screen py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <Link to="/dashboard" className="text-cosmic-300 hover:text-cosmic-400 transition-colors">
            ← Back to Dashboard
          </Link>
          <div className="card mt-4">
            <h1 className="text-3xl font-display font-bold text-cosmic-300 mb-2">
              Mini Report
            </h1>
            <p className="text-gray-400 mb-6">
              {report.birth_data?.name || 'Cosmic Traveler'} • {new Date(report.created_at).toLocaleString()}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white/5 rounded p-3">
                <div className="text-xs text-gray-400">Celtic Moon</div>
                <div className="text-lg font-semibold text-cosmic-300">{computed.celticMoon || '—'}</div>
              </div>
              <div className="bg-white/5 rounded p-3">
                <div className="text-xs text-gray-400">Life Path</div>
                <div className="text-lg font-semibold text-cosmic-300">{computed.lifePath || '—'}</div>
              </div>
              <div className="bg-white/5 rounded p-3">
                <div className="text-xs text-gray-400">Soul Urge</div>
                <div className="text-lg font-semibold text-cosmic-300">{computed.soulUrge || '—'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Fallback
  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-3xl mx-auto card">
        <h1 className="text-2xl font-display font-bold text-cosmic-300 mb-3">Report</h1>
        <pre className="text-xs text-gray-300 overflow-auto">
          {JSON.stringify(report.report_data, null, 2)}
        </pre>
      </div>
    </div>
  )
}

export default Report

