import { useState } from 'react'

const CosmicBlueprintReport = ({ blueprint, onSave, onDownload }) => {
  const [activeTab, setActiveTab] = useState('synthesis')

  const tabs = [
    { id: 'synthesis', label: 'Synthesis', icon: '✨' },
    { id: 'celtic', label: 'Celtic Moon', icon: '🌙' },
    { id: 'astrology', label: 'Astrology', icon: '⭐' },
    { id: 'numerology', label: 'Numerology', icon: '🔢' },
    { id: 'humanDesign', label: 'Human Design', icon: '🎨' },
    { id: 'gematria', label: 'Gematria', icon: '📜' },
    { id: 'chakras', label: 'Chakras', icon: '🧘' },
    { id: 'karma', label: 'Karma', icon: '☯️' },
  ]

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="card mb-6">
        <div className="text-center">
          <h1 className="text-4xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-cosmic-300 to-lunar-300 mb-2">
            {blueprint.personalInfo.name}'s Cosmic Blueprint
          </h1>
          <p className="text-gray-400">
            Generated on {new Date(blueprint.generatedAt).toLocaleDateString()}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center mt-6">
          {onSave && (
            <button onClick={onSave} className="btn-primary">
              💾 Save Report
            </button>
          )}
          {onDownload && (
            <button onClick={onDownload} className="btn-secondary">
              📥 Download PDF
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-cosmic-600 text-white'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="card">
        {activeTab === 'synthesis' && (
          <SynthesisTab data={blueprint.synthesis} />
        )}
        {activeTab === 'celtic' && (
          <CelticMoonTab data={blueprint.celticMoonSign} />
        )}
        {activeTab === 'astrology' && (
          <AstrologyTab data={blueprint.astrology} />
        )}
        {activeTab === 'numerology' && (
          <NumerologyTab data={blueprint.numerology} />
        )}
        {activeTab === 'humanDesign' && (
          <HumanDesignTab data={blueprint.humanDesign} />
        )}
        {activeTab === 'gematria' && (
          <GematriaTab data={blueprint.gematria} />
        )}
        {activeTab === 'chakras' && (
          <ChakrasTab data={blueprint.chakras} />
        )}
        {activeTab === 'karma' && (
          <KarmaTab data={blueprint.karma} />
        )}
      </div>
    </div>
  )
}

const SynthesisTab = ({ data }) => (
  <div className="space-y-6">
    <h2 className="text-3xl font-display font-bold text-cosmic-300">{data.title}</h2>
    <p className="text-lg text-gray-200 leading-relaxed">{data.summary}</p>
    
    <div>
      <h3 className="text-xl font-semibold text-lunar-300 mb-3">Key Strengths</h3>
      <ul className="space-y-2">
        {data.keyStrengths.map((strength, idx) => (
          <li key={idx} className="flex items-start">
            <span className="text-cosmic-400 mr-2">✦</span>
            <span className="text-gray-200">{strength}</span>
          </li>
        ))}
      </ul>
    </div>

    <div>
      <h3 className="text-xl font-semibold text-lunar-300 mb-3">Spiritual Guidance</h3>
      <ul className="space-y-2">
        {data.spiritualGuidance.map((guidance, idx) => (
          <li key={idx} className="flex items-start">
            <span className="text-lunar-400 mr-2">★</span>
            <span className="text-gray-200">{guidance}</span>
          </li>
        ))}
      </ul>
    </div>

    <div className="bg-gradient-to-r from-cosmic-900/50 to-lunar-900/50 rounded-lg p-6">
      <h3 className="text-xl font-semibold text-cosmic-300 mb-3">Daily Affirmations</h3>
      <div className="space-y-2">
        {data.affirmations.map((affirmation, idx) => (
          <p key={idx} className="text-gray-200 italic">"{affirmation}"</p>
        ))}
      </div>
    </div>
  </div>
)

const CelticMoonTab = ({ data }) => (
  <div className="space-y-4">
    <h2 className="text-3xl font-display font-bold text-cosmic-300">Celtic Moon Sign: {data.sign}</h2>
    <div className="bg-cosmic-900/30 rounded-lg p-4">
      <p className="text-sm text-gray-400 mb-1">Element</p>
      <p className="text-xl text-cosmic-300 font-semibold">{data.element}</p>
    </div>
    <p className="text-gray-200 leading-relaxed">{data.description}</p>
    <div>
      <h3 className="text-lg font-semibold text-lunar-300 mb-2">Core Traits</h3>
      <p className="text-gray-300">{data.traits}</p>
    </div>
  </div>
)

const AstrologyTab = ({ data }) => (
  <div className="space-y-4">
    <h2 className="text-3xl font-display font-bold text-cosmic-300">Sun Sign: {data.sunSign}</h2>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-cosmic-900/30 rounded-lg p-4">
        <p className="text-sm text-gray-400">Element</p>
        <p className="text-lg text-cosmic-300 font-semibold">{data.element}</p>
      </div>
      <div className="bg-cosmic-900/30 rounded-lg p-4">
        <p className="text-sm text-gray-400">Modality</p>
        <p className="text-lg text-cosmic-300 font-semibold">{data.modality}</p>
      </div>
      <div className="bg-cosmic-900/30 rounded-lg p-4">
        <p className="text-sm text-gray-400">Ruler</p>
        <p className="text-lg text-cosmic-300 font-semibold">{data.ruler}</p>
      </div>
    </div>
    <p className="text-gray-200 leading-relaxed">{data.description}</p>
    <div>
      <h3 className="text-lg font-semibold text-lunar-300 mb-2">Key Traits</h3>
      <p className="text-gray-300">{data.traits}</p>
    </div>
  </div>
)

const NumerologyTab = ({ data }) => (
  <div className="space-y-6">
    <h2 className="text-3xl font-display font-bold text-cosmic-300">Numerology Analysis</h2>
    
    {Object.entries(data).map(([key, value]) => (
      <div key={key} className="bg-lunar-900/30 rounded-lg p-4">
        <h3 className="text-xl font-semibold text-lunar-300 mb-2 capitalize">
          {key.replace(/([A-Z])/g, ' $1').trim()}
        </h3>
        <div className="flex items-center gap-4 mb-2">
          <span className="text-4xl font-bold text-cosmic-400">{value.number}</span>
          <div>
            <p className="text-lg font-semibold text-gray-200">{value.keyword}</p>
            <p className="text-sm text-gray-400">{value.traits}</p>
          </div>
        </div>
        <p className="text-gray-300">{value.description}</p>
      </div>
    ))}
  </div>
)

const HumanDesignTab = ({ data }) => (
  <div className="space-y-4">
    <h2 className="text-3xl font-display font-bold text-cosmic-300">Human Design Type: {data.type}</h2>
    <div className="bg-cosmic-900/30 rounded-lg p-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-400">Strategy</p>
          <p className="text-lg text-cosmic-300 font-semibold">{data.strategy}</p>
        </div>
        <div>
          <p className="text-sm text-gray-400">Authority</p>
          <p className="text-lg text-cosmic-300 font-semibold">{data.authority}</p>
        </div>
      </div>
    </div>
    <p className="text-gray-200 leading-relaxed">{data.description}</p>
    <div>
      <h3 className="text-lg font-semibold text-lunar-300 mb-2">Characteristics</h3>
      <p className="text-gray-300">{data.traits}</p>
    </div>
    <p className="text-sm text-gray-400">Approximately {data.percentage}% of the population shares this type</p>
  </div>
)

const GematriaTab = ({ data }) => (
  <div className="space-y-4">
    <h2 className="text-3xl font-display font-bold text-cosmic-300">Gematria Analysis</h2>
    <div className="grid md:grid-cols-2 gap-4">
      <div className="bg-cosmic-900/30 rounded-lg p-4">
        <p className="text-sm text-gray-400">Name Value</p>
        <p className="text-3xl text-cosmic-300 font-bold">{data.value}</p>
      </div>
      <div className="bg-cosmic-900/30 rounded-lg p-4">
        <p className="text-sm text-gray-400">Reduced Value</p>
        <p className="text-3xl text-cosmic-300 font-bold">{data.reduced}</p>
      </div>
    </div>
    <p className="text-gray-200 leading-relaxed">{data.description}</p>
    <div className="bg-lunar-900/30 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-lunar-300 mb-2">Interpretation</h3>
      <p className="text-gray-300">{data.interpretation}</p>
    </div>
  </div>
)

const ChakrasTab = ({ data }) => (
  <div className="space-y-6">
    <h2 className="text-3xl font-display font-bold text-cosmic-300">Chakra Analysis</h2>
    <p className="text-gray-200">{data.description}</p>
    
    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-cosmic-900/30 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-cosmic-300 mb-2">Dominant Chakra</h3>
        <ChakraCard chakra={data.dominant} />
      </div>
      <div className="bg-lunar-900/30 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-lunar-300 mb-2">Secondary Chakra</h3>
        <ChakraCard chakra={data.secondary} />
      </div>
    </div>

    <div className="bg-gradient-to-r from-cosmic-900/50 to-lunar-900/50 rounded-lg p-6">
      <h3 className="text-xl font-semibold text-cosmic-300 mb-3">Energy Balance: {data.balance.level}</h3>
      <p className="text-gray-200">{data.balance.description}</p>
    </div>
  </div>
)

const ChakraCard = ({ chakra }) => (
  <div className="space-y-2">
    <p className="text-xl font-semibold text-gray-200">{chakra.name}</p>
    <p className="text-sm text-gray-400">{chakra.sanskrit}</p>
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-400">Color:</span>
      <span className="text-gray-200">{chakra.color}</span>
    </div>
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-400">Element:</span>
      <span className="text-gray-200">{chakra.element}</span>
    </div>
    <p className="text-sm text-gray-300 mt-2">{chakra.focus}</p>
    <p className="text-sm italic text-cosmic-300 mt-2">"{chakra.affirmation}"</p>
  </div>
)

const KarmaTab = ({ data }) => (
  <div className="space-y-6">
    <h2 className="text-3xl font-display font-bold text-cosmic-300">Karmic Path</h2>
    <p className="text-gray-200">{data.description}</p>
    
    <div className="bg-cosmic-900/30 rounded-lg p-6">
      <h3 className="text-2xl font-semibold text-cosmic-300 mb-3">{data.lesson.lesson}</h3>
      <div className="space-y-4">
        <div>
          <p className="text-sm font-semibold text-lunar-300 mb-1">Past Life Indication</p>
          <p className="text-gray-200">{data.lesson.pastLife}</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-lunar-300 mb-1">Current Focus</p>
          <p className="text-gray-200">{data.lesson.currentFocus}</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-lunar-300 mb-1">Soul Purpose</p>
          <p className="text-gray-200">{data.lesson.soulPurpose}</p>
        </div>
      </div>
    </div>

    {data.karmicDebt.hasDebt && (
      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-red-300 mb-2">Karmic Debt Number {data.karmicDebt.number}</h3>
        <p className="text-gray-200">{data.karmicDebt.message}</p>
      </div>
    )}

    <div className="bg-gradient-to-r from-cosmic-900/50 to-lunar-900/50 rounded-lg p-6">
      <h3 className="text-xl font-semibold text-cosmic-300 mb-3">Soul Contract</h3>
      <p className="text-lg text-gray-200 italic">"{data.soulContract}"</p>
    </div>
  </div>
)

export default CosmicBlueprintReport
