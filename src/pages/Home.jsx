import { useState } from 'react'
import { Link } from 'react-router-dom'
import BirthDataForm from '../components/BirthDataForm'
import CosmicBlueprintReport from '../components/CosmicBlueprintReport'
import { generateCosmicBlueprint } from '../utils/cosmicBlueprint'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import OnboardingQuiz, { clearOnboardingQuiz, loadOnboardingQuiz } from '../components/quiz/OnboardingQuiz'

const Home = () => {
  const { user } = useAuth()
  const [blueprint, setBlueprint] = useState(null)
  const [loading, setLoading] = useState(false)
  const [guestReportGenerated, setGuestReportGenerated] = useState(false)
  const [quizSession, setQuizSession] = useState(() => loadOnboardingQuiz())

  const handleGenerateBlueprint = async (birthData) => {
    setLoading(true)
    try {
      // Generate the cosmic blueprint
      const generatedBlueprint = generateCosmicBlueprint(birthData)
      setBlueprint(generatedBlueprint)

      // If user is logged in, save to database
      if (user) {
        await saveReportToDatabase(generatedBlueprint)
      } else {
        // Mark that guest has generated their free report
        setGuestReportGenerated(true)
      }
    } catch (error) {
      console.error('Error generating blueprint:', error)
      alert('An error occurred while generating your blueprint. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const saveReportToDatabase = async (reportData) => {
    try {
      const { error } = await supabase
        .from('cosmic_reports')
        .insert([
          {
            user_id: user.id,
            birth_data: reportData.personalInfo,
            report_data: reportData,
            created_at: new Date().toISOString()
          }
        ])

      if (error) throw error
    } catch (error) {
      console.error('Error saving report:', error)
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

  // Quiz is the intended opener experience.
  // After completion, we proceed to the birth-data form (prefilled where possible).
  if (!quizSession) {
    return (
      <div className="min-h-screen">
        <OnboardingQuiz onComplete={(payload) => setQuizSession(payload)} />
      </div>
    )
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
        <div className="max-w-2xl mx-auto mb-6 flex items-center justify-between gap-3">
          <p className="text-sm text-gray-300">
            Quiz completed — you can continue with your blueprint, or restart the quiz.
          </p>
          <button
            className="btn-secondary"
            onClick={() => {
              clearOnboardingQuiz()
              setQuizSession(null)
            }}
          >
            Restart quiz
          </button>
        </div>
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
        ) : (
          <BirthDataForm
            onSubmit={handleGenerateBlueprint}
            loading={loading}
            initialValues={{
              birthDate: quizSession?.responses?.birth_date || '',
              birthPlace: quizSession?.responses?.birth_location || ''
            }}
          />
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
