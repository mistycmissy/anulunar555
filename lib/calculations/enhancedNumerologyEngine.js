/**
 * Enhanced Numerology Engine for AnuLunar™ - Based on Comprehensive Guide
 * /compatibility-service/utils/enhancedNumerologyEngine.js
 * 
 * Complete numerology system with Three Important Numbers, Triads, and Power Cycles
 */

/**
 * Calculate the Three Important Birth Numbers system
 * @param {Object} person - Person object with birth data
 * @returns {Object} Complete numerology profile
 */
function calculateThreeImportantNumbers(person) {
  const birthDate = new Date(person.birthDate)
  const birthName = person.birthName || person.fullName
  
  // 1. Day of Birth Number
  const dayOfBirth = {
    number: birthDate.getDate(),
    root: reduceToRoot(birthDate.getDate()),
    interpretation: getDayOfBirthInterpretation(reduceToRoot(birthDate.getDate())),
    reveals: "Natural disposition, way of being, daily tendencies"
  }
  
  // 2. Life Purpose Number (Birth Code Number)
  const lifePurpose = calculateLifePurposeNumber(birthDate)
  
  // 3. Destiny Number 
  const destiny = calculateDestinyNumber(birthName)
  
  // Determine Triads
  const triads = determineTriads([dayOfBirth.root, lifePurpose.root, destiny.root])
  
  // Calculate Power Cycles
  const powerCycles = calculatePowerCycles(birthDate, dayOfBirth.root, lifePurpose.root, destiny.root)
  
  return {
    dayOfBirth,
    lifePurpose,
    destiny,
    triads,
    powerCycles,
    birthCode: `${dayOfBirth.root}-${lifePurpose.root}-${destiny.root}`,
    soulDNA: generateSoulDNA([dayOfBirth.root, lifePurpose.root, destiny.root])
  }
}

/**
 * Calculate Life Purpose Number from full birth date
 */
function calculateLifePurposeNumber(birthDate) {
  const month = birthDate.getMonth() + 1
  const day = birthDate.getDate() 
  const year = birthDate.getFullYear()
  
  // Add all digits
  const total = sumAllDigits(month) + sumAllDigits(day) + sumAllDigits(year)
  const root = reduceToRoot(total)
  
  return {
    number: total,
    root: root,
    calculation: `${month} + ${day} + ${year} = ${total} → ${root}`,
    interpretation: getLifePurposeInterpretation(root),
    reveals: "Main reason you're here, your main lesson, how you're designed to feel happily engaged"
  }
}

/**
 * Calculate Destiny Number from birth name
 */
function calculateDestinyNumber(birthName) {
  const letterValues = getPythagoreanLetterValues()
  let total = 0
  const calculation = []
  
  for (let char of birthName.toUpperCase()) {
    if (letterValues[char]) {
      total += letterValues[char]
      calculation.push(`${char}=${letterValues[char]}`)
    }
  }
  
  const root = reduceToRoot(total)
  
  return {
    number: total,
    root: root,
    calculation: calculation.join(' + ') + ` = ${total} → ${root}`,
    interpretation: getDestinyInterpretation(root),
    reveals: "Nature of your work environment, how you naturally use your gifts"
  }
}

/**
 * Determine which Triads a person belongs to
 */
function determineTriads(rootNumbers) {
  const triads = {
    mind: [],      // 1-5-7
    manifestation: [], // 2-4-8  
    creation: []   // 3-6-9
  }
  
  for (let number of rootNumbers) {
    if ([1, 5, 7].includes(number)) {
      triads.mind.push(number)
    }
    if ([2, 4, 8].includes(number)) {
      triads.manifestation.push(number)
    }
    if ([3, 6, 9].includes(number)) {
      triads.creation.push(number)
    }
  }
  
  // Determine dominant triad
  let dominantTriad = 'balanced'
  let maxCount = 0
  
  Object.entries(triads).forEach(([triad, numbers]) => {
    if (numbers.length > maxCount) {
      maxCount = numbers.length
      dominantTriad = triad
    }
  })
  
  return {
    distribution: triads,
    dominant: dominantTriad,
    interpretation: getTriadInterpretation(dominantTriad, triads),
    balance: maxCount <= 1 ? 'perfectly_balanced' : maxCount === 2 ? 'leaning' : 'strongly_aligned'
  }
}

/**
 * Calculate Power Cycles - when personal cycles match birth numbers
 */
function calculatePowerCycles(birthDate, dayRoot, lifePurposeRoot, destinyRoot) {
  const currentYear = new Date().getFullYear()
  const personalYear = calculatePersonalYear(birthDate, currentYear)
  const currentMonth = new Date().getMonth() + 1
  const personalMonth = calculatePersonalMonth(birthDate, currentMonth, currentYear)
  
  const birthNumbers = [dayRoot, lifePurposeRoot, destinyRoot]
  const cycles = {
    current: {
      personalYear: personalYear,
      personalMonth: personalMonth,
      isPowerYear: birthNumbers.includes(personalYear.root),
      isPowerMonth: birthNumbers.includes(personalMonth.root),
      activeNumber: null,
      intensity: 'normal'
    },
    upcoming: findUpcomingPowerCycles(birthDate, birthNumbers, currentYear)
  }
  
  // Determine active power number and intensity
  if (cycles.current.isPowerYear && cycles.current.isPowerMonth) {
    cycles.current.intensity = 'double_amplified'
    cycles.current.activeNumber = personalYear.root
  } else if (cycles.current.isPowerYear) {
    cycles.current.intensity = 'amplified'
    cycles.current.activeNumber = personalYear.root
  } else if (cycles.current.isPowerMonth) {
    cycles.current.intensity = 'heightened'
    cycles.current.activeNumber = personalMonth.root
  }
  
  return cycles
}

/**
 * Enhanced compatibility calculation using Three Important Numbers
 */
function calculateEnhancedNumerologyCompatibility(person1, person2) {
  const profile1 = calculateThreeImportantNumbers(person1)
  const profile2 = calculateThreeImportantNumbers(person2)
  
  // Calculate compatibility for each of the three numbers
  const dayOfBirthCompatibility = calculateNumberCompatibility(
    profile1.dayOfBirth.root, 
    profile2.dayOfBirth.root,
    'day_of_birth'
  )
  
  const lifePurposeCompatibility = calculateNumberCompatibility(
    profile1.lifePurpose.root,
    profile2.lifePurpose.root, 
    'life_purpose'
  )
  
  const destinyCompatibility = calculateNumberCompatibility(
    profile1.destiny.root,
    profile2.destiny.root,
    'destiny'
  )
  
  // Triad compatibility
  const triadCompatibility = calculateTriadCompatibility(profile1.triads, profile2.triads)
  
  // Power Cycle synchronicity
  const powerCycleSync = calculatePowerCycleSynchronicity(profile1.powerCycles, profile2.powerCycles)
  
  // Overall score weighted by importance
  const overallScore = (
    dayOfBirthCompatibility.score * 0.30 +      // Daily interaction - 30%
    lifePurposeCompatibility.score * 0.35 +     // Life purpose alignment - 35%
    destinyCompatibility.score * 0.25 +         // Career/mission compatibility - 25% 
    triadCompatibility.score * 0.10             // Overall approach to life - 10%
  )
  
  return {
    overall: {
      score: Math.round(overallScore * 10) / 10,
      level: getCompatibilityLevel(overallScore),
      description: generateCompatibilityDescription(overallScore, profile1, profile2)
    },
    detailed: {
      dayOfBirth: dayOfBirthCompatibility,
      lifePurpose: lifePurposeCompatibility,
      destiny: destinyCompatibility,
      triads: triadCompatibility,
      powerCycles: powerCycleSync
    },
    profiles: {
      person1: profile1,
      person2: profile2
    },
    guidance: generateCompatibilityGuidance(profile1, profile2, overallScore),
    affirmation: generateCompatibilityAffirmation(profile1, profile2)
  }
}

/**
 * Calculate compatibility between two specific numbers
 */
function calculateNumberCompatibility(num1, num2, type) {
  let score = 5.0 // Base score
  let description = ""
  let dynamics = ""
  
  if (num1 === num2) {
    score = 9.0
    description = "Identical numbers create deep understanding and natural synchronization"
    dynamics = "mirror_souls"
  } else {
    // Use compatibility matrix based on numerology principles
    const compatibilityMatrix = getNumberCompatibilityMatrix()
    const key = `${num1}-${num2}`
    const reverseKey = `${num2}-${num1}`
    
    if (compatibilityMatrix[key]) {
      score = compatibilityMatrix[key].score
      description = compatibilityMatrix[key].description
      dynamics = compatibilityMatrix[key].dynamics
    } else if (compatibilityMatrix[reverseKey]) {
      score = compatibilityMatrix[reverseKey].score
      description = compatibilityMatrix[reverseKey].description
      dynamics = compatibilityMatrix[reverseKey].dynamics
    } else {
      // Calculate based on number relationships
      const difference = Math.abs(num1 - num2)
      if (difference === 1) {
        score = 8.0
        description = "Adjacent numbers create complementary and supportive energy"
        dynamics = "complementary"
      } else if (difference <= 2) {
        score = 7.0
        description = "Close numbers with harmonious resonance"
        dynamics = "harmonious"
      } else if (difference <= 4) {
        score = 6.0
        description = "Moderate compatibility with growth opportunities"
        dynamics = "growth_oriented"
      } else {
        score = 4.0
        description = "Different approaches requiring understanding and patience"
        dynamics = "challenging"
      }
    }
  }
  
  return {
    score,
    description,
    dynamics,
    numbers: [num1, num2],
    type,
    interpretation: getTypeSpecificInterpretation(num1, num2, type, score)
  }
}

/**
 * Generate Soul DNA code from three numbers
 */
function generateSoulDNA(numbers) {
  const [day, purpose, destiny] = numbers
  
  // Create unique patterns based on number combinations
  const patterns = {
    leadership: [1, 8].some(n => numbers.includes(n)),
    creativity: [3, 6, 9].some(n => numbers.includes(n)),
    intuition: [2, 7, 11].some(n => numbers.includes(n)),
    building: [4, 8].some(n => numbers.includes(n)),
    freedom: [5].includes(numbers),
    service: [6, 9].some(n => numbers.includes(n))
  }
  
  const activePatterns = Object.entries(patterns)
    .filter(([pattern, active]) => active)
    .map(([pattern]) => pattern)
  
  return {
    code: `${day}${purpose}${destiny}`,
    patterns: activePatterns,
    description: generateSoulDNADescription(activePatterns, numbers),
    frequency: calculateSoulFrequency(numbers)
  }
}

/**
 * Get detailed interpretation for root numbers
 */
function getRootNumberInterpretation(number) {
  const interpretations = {
    1: {
      keywords: "New beginnings, originality, leadership, courage, innovation, independence",
      positive: "Natural and authentic leader, original thinker with unique ideas, accomplished, active, energetic, strong-willed, determined, courageous, works best independently, creative, innovative, pioneering, high self-worth and dignity, ambitious, achievement-oriented, protective of vulnerable others, private, enjoys solitude, impeccable taste, appreciation for fine things, bypasses codependency naturally",
      shadow: "Stubborn, prideful, ego-driven, complains when ambitions thwarted, self-centered, bruised ego syndrome, doesn't respond well to criticism (but dishes it out), boastful, aggressive, cynical, egotistical, may bully to create false sense of power, repressed feelings turn to anger, unwilling to cooperate easily, resistant to authority, resistant to being told what to do",
      outOfBalance: "Feels superior to others, arrogant, conceited, obstinate, inconsiderate",
      pathToHarmony: "Be carefree and spontaneous, loosen control, use humor, tap into love of discovery",
      affirmation: "I am at one with my mind, heart and soul. I magically create miraculous opportunities for me to accomplish anything!",
      careerAlignment: "Best as own boss, innovative leader, original creator",
      archetype: "The Innovator"
    },
    2: {
      keywords: "Peace, balance, unity, harmony, duality, partnership, diplomacy, sensitivity",
      positive: "Natural peacemaker, mediator, diplomat, brings opposites together, highly sensitive, gentle heart, imaginative and inventive, well-developed intuition, eye for detail, helpful, supportive, kind, romantic, psychic (may keep private), patient, cooperative, quiet, loving, compassionate, gets along with virtually anyone, excellent manager with miraculous touch of persuasion, naturally responsible, conscientious, efficient, usually humble, very psychic (though secretive), extremely sensitive to others' feelings, generous friend, great companion, natural interest in human psychology, excellent observer, very romantic, natural gift of attraction to financial well-being, very giving with resources",
      shadow: "Fearful of the unknown, unusually cautious, active imagination fuels fears and worries, appears calm but hides neurotic, touchy, nervous disposition, retreats into silence when hurt, out of alignment: feels inadequate, low self-esteem, sets expectations too high for self, self-criticism and doubt, may demand too much detail, can become bitter and broken in disharmonious environments, possessive of things and people, indecision leads to feeling divided, lax with internet/social media, creating false connection, may sacrifice own ideas for someone else's cause",
      outOfBalance: "Neurotic, overly cautious, pessimistic, bitter, broken",
      pathToHarmony: "RELAX. Deep breathing, meditation, exercise daily. Accept life has both positive and negative. Maintain boundaries. Release desire to please and be perfect. Discern what matters.",
      affirmation: "I am indivisible. I breathe deeply and feel connected to the divine at all times. I am grateful for every experience that comes my way and see hidden benefits to each encounter in my life.",
      careerAlignment: "Mediator, healer, diplomat, one-on-one counselor, peacemaker",
      archetype: "The Peacemaker"
    },
    3: {
      keywords: "Creativity, expression, joy, truth, communication, trinity, fertility, enthusiasm",
      positive: "Highly creative, action-oriented, truthful, radiates joy, fluid movement through life, heart-centered living, connected to truth, fertility, creation, trinity energy (Mother-Father-Child) governs creation, usually very talented, vivacious, ingenious, brilliant, curious, love to learn, ask questions constantly, fiercely independent, seeking total freedom, artistic touch (even if not in arts), MUST express themselves (writing, speaking, performing, platform needed), natural communicator, always something to say, fierce advocate of freedom of speech and expression, tremendous powers of creation, magnetic, smile lights up the room, great sense of humor, cheerful disposition, contagious optimism, glass half full",
      shadow: "Can become moody, dissipate energy, get distracted, tendency to exaggerate or stretch the truth, tendency toward addictive behaviors when not expressing creativity, may become critical, gossipy, jealous, tendency to scatter energy in too many directions, may use words to wound rather than heal",
      outOfBalance: "Critical, gossipy, scattered, moody, addictive tendencies",
      pathToHarmony: "Engage heart fully; laughter and play reset mood and energy. Focus creative energy on meaningful expression.",
      affirmation: "I express my authentic truth with joy and creativity. My words and actions inspire and uplift others.",
      careerAlignment: "Creative fields, communication, entertainment, teaching, inspiring others",
      archetype: "The Creator & Messenger"
    },
    // Continue for all 9 numbers...
    4: {
      archetype: "The Builder",
      keywords: "Stability, organization, hard work, patience, loyalty, practicality"
    },
    5: {
      archetype: "The Adventurer", 
      keywords: "Freedom, adventure, curiosity, versatility, change, experience"
    },
    6: {
      archetype: "The Healer",
      keywords: "Love, nurturing, healing, responsibility, family, service"
    },
    7: {
      archetype: "The Seeker",
      keywords: "Spirituality, introspection, analysis, wisdom, mystery, solitude"
    },
    8: {
      archetype: "The Visionary",
      keywords: "Achievement, material success, authority, recognition, power, ambition"
    },
    9: {
      archetype: "The Humanitarian", 
      keywords: "Completion, wisdom, compassion, universal love, service, philanthropy"
    }
  }
  
  return interpretations[number] || { archetype: "Unknown", keywords: "" }
}

/**
 * Helper functions
 */

function reduceToRoot(number, keepMaster = true) {
  const masterNumbers = [11, 22, 33, 44]
  
  while (number > 9) {
    if (keepMaster && masterNumbers.includes(number)) {
      return number
    }
    number = sumAllDigits(number)
  }
  
  return number
}

function sumAllDigits(number) {
  return number.toString().split('').reduce((sum, digit) => sum + parseInt(digit), 0)
}

function getPythagoreanLetterValues() {
  return {
    'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8, 'I': 9,
    'J': 1, 'K': 2, 'L': 3, 'M': 4, 'N': 5, 'O': 6, 'P': 7, 'Q': 8, 'R': 9,
    'S': 1, 'T': 2, 'U': 3, 'V': 4, 'W': 5, 'X': 6, 'Y': 7, 'Z': 8
  }
}

function calculatePersonalYear(birthDate, year) {
  const month = birthDate.getMonth() + 1
  const day = birthDate.getDate()
  const total = month + day + reduceToRoot(year)
  
  return {
    number: total,
    root: reduceToRoot(total),
    year: year
  }
}

function calculatePersonalMonth(birthDate, month, year) {
  const personalYear = calculatePersonalYear(birthDate, year)
  const total = personalYear.root + month
  
  return {
    number: total,
    root: reduceToRoot(total),
    month: month,
    year: year
  }
}

// Export the enhanced numerology functions
module.exports = {
  calculateThreeImportantNumbers,
  calculateEnhancedNumerologyCompatibility,
  getRootNumberInterpretation,
  calculateLifePurposeNumber,
  calculateDestinyNumber,
  determineTriads,
  calculatePowerCycles,
  generateSoulDNA,
  reduceToRoot
}
