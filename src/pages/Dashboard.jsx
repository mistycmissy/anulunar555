import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

const ONBOARDING_STORAGE_KEY = 'anulunar_onboarding_quiz_v1'

const Dashboard = () => {
  const { user } = useAuth()
  const [reports, setReports] = useState([])
  const [stats, setStats] = useState({ totalReports: 0, points: 0 })
  const [loading, setLoading] = useState(true)

  const loadDashboardData = useCallback(async () => {
    try {
      // Load user reports
      const { data: reportsData, error: reportsError } = await supabase
        .from('cosmic_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (reportsError) throw reportsError

      setReports(reportsData || [])

      // Load user profile/stats
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('points')
        .eq('user_id', user.id)
        .single()

      if (!profileError && profileData) {
        setStats({
          totalReports: reportsData?.length || 0,
          points: profileData.points || 0
        })
      } else {
        setStats({
          totalReports: reportsData?.length || 0,
          points: 100 // Default welcome points
        })
      }
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }, [user.id])

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user, loadDashboardData])

  useEffect(() => {
    // If a guest completed the opener quiz, persist the mini report into the user's portal after sign-in.
    if (!user) return
    ;(async () => {
      try {
        const raw = localStorage.getItem(ONBOARDING_STORAGE_KEY)
        if (!raw) return
        const session = JSON.parse(raw)
        if (!session?.computed?.lifePath) return

        const birthData = {
          name: `${session?.responses?.first_name || ''} ${session?.responses?.last_name || ''}`.trim(),
          birthDate: session?.responses?.birth_date,
          birthTime: session?.responses?.birth_time,
          birthPlace: session?.responses?.birth_location || session?.responses?.birth_country,
        }

        const reportData = {
          kind: 'mini_report',
          created_at: session?.completed_at,
          computed: session?.computed,
          ab_variant: session?.ab_variant,
          affiliate_code: session?.affiliate_code,
          quiz_responses: session?.responses,
        }

        await supabase.from('cosmic_reports').insert([
          {
            user_id: user.id,
            birth_data: birthData,
            report_data: reportData,
            created_at: new Date().toISOString(),
          },
        ])

        localStorage.removeItem(ONBOARDING_STORAGE_KEY)
        loadDashboardData()
      } catch (error) {
        console.error('Error persisting mini report:', error)
      }
    })()
  }, [user, loadDashboardData])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-cosmic-300 text-xl">Loading your cosmic journey...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="card mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-display font-bold text-cosmic-300 mb-2">
                Welcome back, {user?.user_metadata?.first_name || 'Cosmic Traveler'}!
              </h1>
              <p className="text-gray-400">Your spiritual intelligence dashboard</p>
            </div>
            <Link to="/" className="btn-primary">
              ✨ Generate New Blueprint
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon="📊"
            title="Total Reports"
            value={stats.totalReports}
            subtitle="Cosmic blueprints generated"
          />
          <StatCard
            icon="⭐"
            title="Cosmic Points"
            value={stats.points}
            subtitle="Earn points for engagement"
          />
          <StatCard
            icon="🎯"
            title="Journey Level"
            value={Math.floor(stats.points / 100)}
            subtitle="Level up your cosmic wisdom"
          />
        </div>

        {/* Reports History */}
        <div className="card">
          <h2 className="text-2xl font-display font-semibold text-cosmic-300 mb-6">
            Your Cosmic Blueprints
          </h2>

          {reports.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🌙</div>
              <p className="text-gray-400 mb-4">You haven't generated any reports yet</p>
              <Link to="/" className="btn-primary inline-block">
                Create Your First Blueprint
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const StatCard = ({ icon, title, value, subtitle }) => (
  <div className="card hover:border-cosmic-500/40 transition-all">
    <div className="text-4xl mb-3">{icon}</div>
    <div className="text-3xl font-bold text-cosmic-400 mb-1">{value}</div>
    <div className="text-sm font-semibold text-gray-300 mb-1">{title}</div>
    <div className="text-xs text-gray-500">{subtitle}</div>
  </div>
)

const ReportCard = ({ report }) => {
  const reportData = report.report_data
  const birthData = report.birth_data

  return (
    <div className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-all border border-white/10">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-cosmic-300 mb-2">
            {birthData?.name || 'Cosmic Blueprint'}
          </h3>
          <div className="flex flex-wrap gap-4 text-sm text-gray-400">
            <span>🌙 {reportData?.celticMoonSign?.sign}</span>
            <span>⭐ {reportData?.astrology?.sunSign}</span>
            <span>🔢 Life Path {reportData?.numerology?.lifePath?.number}</span>
            <span>🎨 {reportData?.humanDesign?.type}</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Generated {new Date(report.created_at).toLocaleDateString()}
          </p>
        </div>
        <Link
          to={`/report/${report.id}`}
          className="btn-secondary text-sm py-1.5 px-4 whitespace-nowrap"
        >
          View Report
        </Link>
      </div>
    </div>
  )
}

export default Dashboard
