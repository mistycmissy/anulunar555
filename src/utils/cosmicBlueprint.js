import { calculateCelticMoonSign } from './celticMoonSign'
import { calculateLifePath, calculateExpression, calculateSoulUrge, calculatePersonality, getNumerologyMeaning } from './numerology'
import { calculateZodiacSign } from './astrology'
import { calculateHumanDesignType, calculateHumanDesignAuthority } from './humanDesign'
import { calculateNameVibration } from './gematria'
import { analyzeChakras } from './chakras'
import { calculateKarma } from './karma'

export const generateCosmicBlueprint = (birthData) => {
  const { birthDate, firstName, lastName, birthTime, birthPlace } = birthData
  const fullName = `${firstName} ${lastName}`.trim()

  // Calculate all aspects
  const celticMoonSign = calculateCelticMoonSign(birthDate)
  const zodiacSign = calculateZodiacSign(birthDate)
  
  const lifePath = calculateLifePath(birthDate)
  const expression = calculateExpression(fullName)
  const soulUrge = calculateSoulUrge(fullName)
  const personality = calculatePersonality(fullName)
  
  const humanDesign = calculateHumanDesignType(birthDate)
  const humanDesignAuthority = calculateHumanDesignAuthority(humanDesign.name)
  
  const gematria = calculateNameVibration(firstName, lastName)
  const chakraAnalysis = analyzeChakras(birthDate, fullName)
  const karmaAnalysis = calculateKarma(birthDate, fullName)

  // Generate comprehensive report
  return {
    personalInfo: {
      name: fullName,
      birthDate,
      birthTime,
      birthPlace
    },
    celticMoonSign: {
      sign: celticMoonSign.name,
      traits: celticMoonSign.traits,
      element: celticMoonSign.element,
      description: `As a ${celticMoonSign.name} moon sign, you embody ${celticMoonSign.traits.toLowerCase()}. This ${celticMoonSign.element} sign brings powerful energies of transformation and connection to lunar cycles.`
    },
    astrology: {
      sunSign: zodiacSign.name,
      element: zodiacSign.element,
      modality: zodiacSign.modality,
      ruler: zodiacSign.ruler,
      traits: zodiacSign.traits,
      description: `Your ${zodiacSign.name} sun sign reveals your core essence. As a ${zodiacSign.element} ${zodiacSign.modality} sign ruled by ${zodiacSign.ruler}, you naturally express: ${zodiacSign.traits.toLowerCase()}.`
    },
    numerology: {
      lifePath: {
        number: lifePath,
        ...getNumerologyMeaning(lifePath),
        description: `Your Life Path ${lifePath} reveals your soul's journey and purpose in this lifetime.`
      },
      expression: {
        number: expression,
        ...getNumerologyMeaning(expression),
        description: `Expression Number ${expression} shows how you manifest your abilities in the world.`
      },
      soulUrge: {
        number: soulUrge,
        ...getNumerologyMeaning(soulUrge),
        description: `Soul Urge ${soulUrge} reveals your heart's deepest desires and motivations.`
      },
      personality: {
        number: personality,
        ...getNumerologyMeaning(personality),
        description: `Personality Number ${personality} shows how others perceive you.`
      }
    },
    humanDesign: {
      type: humanDesign.name,
      strategy: humanDesign.strategy,
      authority: humanDesignAuthority,
      description: humanDesign.description,
      traits: humanDesign.traits,
      percentage: humanDesign.percentage
    },
    gematria: {
      value: gematria.value,
      reduced: gematria.reduced,
      interpretation: gematria.interpretation,
      description: `Your name carries the vibration of ${gematria.value}, reducing to ${gematria.reduced}. ${gematria.interpretation}`
    },
    chakras: {
      dominant: chakraAnalysis.dominant,
      secondary: chakraAnalysis.secondary,
      balance: chakraAnalysis.balance,
      all: chakraAnalysis.all,
      description: `Your dominant chakra is the ${chakraAnalysis.dominant.name} (${chakraAnalysis.dominant.sanskrit}), focusing on ${chakraAnalysis.dominant.focus.toLowerCase()}. Balance state: ${chakraAnalysis.balance.level}.`
    },
    karma: {
      lesson: karmaAnalysis.mainLesson,
      karmicDebt: karmaAnalysis.karmicDebt,
      soulContract: karmaAnalysis.soulContract,
      description: `Your karmic path centers on: ${karmaAnalysis.mainLesson.lesson}. ${karmaAnalysis.mainLesson.currentFocus}`
    },
    synthesis: generateSynthesis(celticMoonSign, zodiacSign, lifePath, humanDesign, karmaAnalysis),
    generatedAt: new Date().toISOString(),
    version: '1.0.0'
  }
}

const generateSynthesis = (celticSign, zodiacSign, lifePath, humanDesign, karma) => {
  return {
    title: 'Your Cosmic Blueprint Synthesis',
    summary: `You are a ${celticSign.name} moon sign and ${zodiacSign.name} sun sign walking Life Path ${lifePath}. As a ${humanDesign.name} in Human Design, your strategy is to ${humanDesign.strategy.toLowerCase()}. Your soul's current lesson is ${karma.mainLesson.lesson.toLowerCase()}.`,
    keyStrengths: [
      `${celticSign.element} energy from your Celtic moon sign brings ${celticSign.traits.split(',')[0].toLowerCase()}`,
      `${zodiacSign.element} element provides ${zodiacSign.traits.split(',')[0].toLowerCase()}`,
      `Life Path ${lifePath} empowers you with ${getNumerologyMeaning(lifePath).traits.split(',')[0].toLowerCase()}`,
      `${humanDesign.name} type gives you ${humanDesign.traits.split(',')[0].toLowerCase()} energy`
    ],
    spiritualGuidance: [
      `Honor your ${humanDesign.strategy} strategy in all decisions`,
      `Embrace your ${celticSign.name} moon's ${celticSign.element} energy through nature connection`,
      `Follow your Life Path ${lifePath} purpose: ${getNumerologyMeaning(lifePath).keyword.toLowerCase()}`,
      karma.mainLesson.currentFocus,
      karma.soulContract
    ],
    affirmations: [
      `I am aligned with my cosmic blueprint`,
      `I honor my ${humanDesign.name} nature`,
      `I walk my Life Path ${lifePath} with confidence`,
      `I embody the wisdom of ${celticSign.name} and ${zodiacSign.name}`
    ]
  }
}

// Validate birth data
export const validateBirthData = (data) => {
  const errors = {}

  if (!data.firstName || data.firstName.trim().length < 1) {
    errors.firstName = 'First name is required'
  }

  if (!data.lastName || data.lastName.trim().length < 1) {
    errors.lastName = 'Last name is required'
  }

  if (!data.birthDate) {
    errors.birthDate = 'Birth date is required'
  } else {
    const date = new Date(data.birthDate)
    const now = new Date()
    if (date > now) {
      errors.birthDate = 'Birth date cannot be in the future'
    }
    if (date < new Date('1900-01-01')) {
      errors.birthDate = 'Birth date seems too far in the past'
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}
