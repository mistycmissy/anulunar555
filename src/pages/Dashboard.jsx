import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { getDailyMicroInsight, getWeeklyTheme, getMoonPhase } from '../utils/dailyGuidance'

const Dashboard = () => {
  const { user } = useAuth()
  const [reports, setReports] = useState([])
  const [stats, setStats] = useState({ totalReports: 0, points: 0 })
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const loadDashboardData = useCallback(async () => {
    try {
      // Load user reports (larger schema)
      const { data: reportsData, error: reportsError } = await supabase
        .from('spiritual_reports')
        .select('*')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false })

      if (reportsError) throw reportsError

      setReports(reportsData || [])

      setStats({
        totalReports: reportsData?.length || 0,
        points: 0
      })
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-cosmic-300 text-xl">Loading your cosmic journey...</div>
      </div>
    )
  }

  const latestReport = reports?.[0]?.synthesized_content || reports?.[0]?.report_data
  const firstName = user?.user_metadata?.first_name
  const celticMoonSign = latestReport?.celticMoonSign?.sign
  const sunSign = latestReport?.astrology?.sunSign
  const lifePath = latestReport?.numerology?.lifePath?.number

  const todayMessage = getDailyMicroInsight(
    { firstName, celticMoonSign, sunSign, lifePath },
    new Date()
  )
  const { phaseName, theme } = getWeeklyTheme({ celticMoonSign }, new Date())
  const { lunarDay } = getMoonPhase(new Date())

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(todayMessage)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // ignore
    }
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

        {/* Daily Guidance */}
        <div className="card mb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-[240px]">
              <div className="text-sm font-semibold text-gray-300">Today’s guidance</div>
              <div className="text-xs text-gray-500 mt-1">
                {phaseName} • Lunar Day {lunarDay} • Weekly theme: {theme}
              </div>
            </div>
            <button onClick={handleCopy} className="btn-secondary text-sm py-2 px-4">
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="mt-4 text-lg text-gray-200 leading-relaxed">
            {todayMessage}
          </div>
          <div className="mt-3 text-xs text-gray-500">
            Short beats daily. Deep reports live in your blueprints.
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
