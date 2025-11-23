import { useState } from 'react'

const Marketplace = () => {
  const [activeFilter, setActiveFilter] = useState('all')

  const practitioners = [
    {
      id: 1,
      name: 'Luna Starweaver',
      specialty: 'Astrology & Tarot',
      rating: 4.9,
      reviews: 127,
      rate: '$75/hr',
      description: 'Expert in natal chart readings and tarot guidance',
      availability: 'Available',
      image: '🌟'
    },
    {
      id: 2,
      name: 'River Moonstone',
      specialty: 'Human Design',
      rating: 4.8,
      reviews: 89,
      rate: '$60/hr',
      description: 'Specialized in Human Design chart analysis',
      availability: 'Available',
      image: '🎨'
    },
    {
      id: 3,
      name: 'Sage Willow',
      specialty: 'Numerology',
      rating: 5.0,
      reviews: 203,
      rate: '$80/hr',
      description: 'Master numerologist with 15+ years experience',
      availability: 'Booked',
      image: '🔢'
    },
    {
      id: 4,
      name: 'Crystal Dawn',
      specialty: 'Chakra Healing',
      rating: 4.7,
      reviews: 156,
      rate: '$65/hr',
      description: 'Energy healer and chakra balance specialist',
      availability: 'Available',
      image: '🧘'
    },
  ]

  const filters = [
    { id: 'all', label: 'All Practitioners' },
    { id: 'astrology', label: 'Astrology' },
    { id: 'numerology', label: 'Numerology' },
    { id: 'healing', label: 'Energy Healing' },
    { id: 'design', label: 'Human Design' },
  ]

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="card mb-8">
          <h1 className="text-3xl font-display font-bold text-cosmic-300 mb-2">
            Practitioner Marketplace
          </h1>
          <p className="text-gray-400">
            Connect with verified spiritual practitioners for personalized guidance
          </p>
        </div>

        {/* Filters */}
        <div className="card mb-8">
          <div className="flex flex-wrap gap-3">
            {filters.map(filter => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeFilter === filter.id
                    ? 'bg-cosmic-600 text-white'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Coming Soon Notice */}
        <div className="card mb-8 bg-cosmic-900/30 border-cosmic-500/30">
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🚀</div>
            <h2 className="text-2xl font-semibold text-cosmic-300 mb-3">
              Marketplace Coming Soon
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto mb-6">
              We're building a platform to connect you with verified spiritual practitioners.
              The marketplace will include booking, reviews, and secure payments.
            </p>
            <div className="inline-flex items-center gap-2 bg-white/5 px-6 py-3 rounded-lg">
              <span className="text-lunar-300">📧</span>
              <span className="text-gray-300">Join waitlist for early access</span>
            </div>
          </div>
        </div>

        {/* Preview Practitioners Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {practitioners.map(practitioner => (
            <PractitionerCard key={practitioner.id} practitioner={practitioner} />
          ))}
        </div>
      </div>
    </div>
  )
}

const PractitionerCard = ({ practitioner }) => (
  <div className="card hover:border-cosmic-500/40 transition-all">
    <div className="flex items-start gap-4">
      <div className="text-5xl">{practitioner.image}</div>
      <div className="flex-1">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-lg font-semibold text-cosmic-300">{practitioner.name}</h3>
            <p className="text-sm text-lunar-300">{practitioner.specialty}</p>
          </div>
          <span className={`text-xs px-2 py-1 rounded ${
            practitioner.availability === 'Available' 
              ? 'bg-green-900/30 text-green-300' 
              : 'bg-gray-700/30 text-gray-400'
          }`}>
            {practitioner.availability}
          </span>
        </div>
        
        <div className="flex items-center gap-3 mb-3 text-sm">
          <div className="flex items-center gap-1">
            <span className="text-yellow-400">★</span>
            <span className="text-gray-300">{practitioner.rating}</span>
          </div>
          <span className="text-gray-500">•</span>
          <span className="text-gray-400">{practitioner.reviews} reviews</span>
          <span className="text-gray-500">•</span>
          <span className="text-cosmic-400 font-semibold">{practitioner.rate}</span>
        </div>

        <p className="text-sm text-gray-400 mb-4">{practitioner.description}</p>

        <button 
          disabled 
          className="btn-primary text-sm py-2 px-4 w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Book Session (Coming Soon)
        </button>
      </div>
    </div>
  </div>
)

export default Marketplace
