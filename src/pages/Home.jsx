import { useState } from 'react'
import { Link } from 'react-router-dom'
import BirthDataForm from '../components/BirthDataForm'
import CosmicBlueprintReport from '../components/CosmicBlueprintReport'
import EssenceFirstQuiz from '../components/quiz/EssenceFirstQuiz'
import { generateCosmicBlueprint } from '../utils/cosmicBlueprint'
import { trackEvent } from '../utils/analytics'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

const Home = () => {
  const { user } = useAuth()
  const [blueprint, setBlueprint] = useState(null)
  const [loading, setLoading] = useState(false)
  const [guestReportGenerated, setGuestReportGenerated] = useState(false)
  const [unlocked, setUnlocked] = useState(false)

  const handleGenerateBlueprint = async (birthData) => {
    setLoading(true)
    try {
      await trackEvent('blueprint_generate_started', {
        is_logged_in: Boolean(user)
      })

      // Generate the cosmic blueprint
      const generatedBlueprint = generateCosmicBlueprint(birthData)
      setBlueprint(generatedBlueprint)

      // If user is logged in, save to database
      if (user) {
        await saveReportToDatabase(generatedBlueprint)
      } else {
        // Mark that guest has generated their free report
        setGuestReportGenerated(true)
        await trackEvent('guest_free_report_used', {
          source: 'home'
        })
      }

      await trackEvent('blueprint_generated', {
        is_logged_in: Boolean(user),
        life_path: generatedBlueprint?.numerology?.lifePath?.number
      })
    } catch (error) {
      console.error('Error generating blueprint:', error)
      await trackEvent('blueprint_generate_failed', {
        message: error?.message
      })
      alert('An error occurred while generating your blueprint. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const saveReportToDatabase = async (reportData) => {
    try {
      // Ensure a `profiles` row exists for the authed user.
      // The larger Supabase schema uses `profiles` + `spiritual_reports`.
      const { error: profileError } = await supabase.from('profiles').upsert(
        [
          {
            id: user.id,
            email: user.email,
            first_name: reportData?.personalInfo?.name?.split(' ')?.[0] || user?.user_metadata?.first_name || null,
            last_name:
              reportData?.personalInfo?.name?.split(' ')?.slice(1)?.join(' ') ||
              user?.user_metadata?.last_name ||
              null
          }
        ],
        { onConflict: 'id' }
      )

      if (profileError) {
        console.error('Error upserting profile:', profileError)
        throw profileError
      }

      const { error } = await supabase.from('spiritual_reports').insert([
        {
          profile_id: user.id,
          report_type: 'complete_spiritual_intelligence',
          report_tier: 'crystal_clarity',
          sacred_price: 0,
          generation_status: 'completed',
          synthesized_content: reportData,
          generated_at: new Date().toISOString()
        }
      ])

      if (error) throw error
      await trackEvent('blueprint_saved', {
        source: 'home'
      })
    } catch (error) {
      console.error('Error saving report:', error)
      await trackEvent('blueprint_save_failed', {
        message: error?.message
      })
    }
  }

  const handleSaveReport = async () => {
    if (!user) {
      alert('Please sign in to save your report')
      return
    }
    await saveReportToDatabase(blueprint)
    alert('Report saved successfully!')
  }

  const handleDownloadReport = () => {
    // Simple JSON download for now
    const dataStr = JSON.stringify(blueprint, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    const exportFileDefaultName = `cosmic-blueprint-${blueprint.personalInfo.name.replace(/\s/g, '-')}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const handleNewReport = () => {
    setBlueprint(null)
  }

  if (blueprint) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="container mx-auto">
          <button
            onClick={handleNewReport}
            className="mb-4 text-cosmic-300 hover:text-cosmic-400 transition-colors"
          >
            ← Generate New Report
          </button>
          <CosmicBlueprintReport
            blueprint={blueprint}
            onSave={user ? handleSaveReport : null}
            onDownload={handleDownloadReport}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="text-center py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-cosmic-300 via-lunar-300 to-cosmic-300 mb-6">
            Discover Your Cosmic Blueprint
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Generate personalized spiritual intelligence reports combining Celtic Moon Signs, 
            numerology, astrology, Human Design, gematria, chakras, and karma analysis
          </p>
          
          {!user && (
            <div className="bg-cosmic-900/30 border border-cosmic-500/30 rounded-lg p-6 mb-8">
              <p className="text-lg text-cosmic-300 mb-2">
                ✨ Get One Free Report Without Account
              </p>
              <p className="text-gray-400">
                Sign up for unlimited reports and save your cosmic journey
              </p>
              <Link to="/signup" className="btn-primary inline-block mt-4">
                Create Free Account
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <FeatureCard
            icon="🌙"
            title="Celtic Moon Signs"
            description="13 lunar month system revealing your moon nature"
          />
          <FeatureCard
            icon="🔢"
            title="Numerology"
            description="Life path, expression, soul urge calculations"
          />
          <FeatureCard
            icon="⭐"
            title="Astrology"
            description="Zodiac signs and celestial influences"
          />
          <FeatureCard
            icon="🎨"
            title="Human Design"
            description="Your energy type and life strategy"
          />
          <FeatureCard
            icon="📜"
            title="Gematria"
            description="Sacred numerology of your name"
          />
          <FeatureCard
            icon="🧘"
            title="Chakra Analysis"
            description="Energy center balance and activation"
          />
          <FeatureCard
            icon="☯️"
            title="Karma & Lessons"
            description="Soul purpose and karmic patterns"
          />
          <FeatureCard
            icon="💫"
            title="Synthesis"
            description="Integrated cosmic wisdom report"
          />
        </div>
      </div>

      {/* Form Section */}
      <div className="py-8 px-4">
        {!user && guestReportGenerated ? (
          <div className="max-w-2xl mx-auto card text-center">
            <h2 className="text-2xl font-semibold text-cosmic-300 mb-4">
              You've Used Your Free Report
            </h2>
            <p className="text-gray-300 mb-6">
              Sign up to generate unlimited cosmic blueprints and save your reports
            </p>
            <Link to="/signup" className="btn-primary inline-block">
              Create Free Account
            </Link>
          </div>
        ) : !user && !unlocked ? (
          <EssenceFirstQuiz
            onUnlocked={async ({ email, firstName }) => {
              setUnlocked(true)
              await trackEvent('essence_quiz_unlocked', { has_email: Boolean(email), first_name: firstName })
            }}
          />
        ) : (
          <BirthDataForm onSubmit={handleGenerateBlueprint} loading={loading} />
        )}
      </div>

      {/* Footer Info */}
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-400 mb-4">
          Open source spiritual intelligence platform • GNU GPL Licensed
        </p>
        <p className="text-gray-500 text-sm">
          Created with love in memory of Amanda Panda 💖
        </p>
      </div>
    </div>
  )
}

const FeatureCard = ({ icon, title, description }) => (
  <div className="card hover:border-cosmic-500/40 transition-all">
    <div className="text-4xl mb-3">{icon}</div>
    <h3 className="text-lg font-semibold text-cosmic-300 mb-2">{title}</h3>
    <p className="text-sm text-gray-400">{description}</p>
  </div>
)

export default Home
