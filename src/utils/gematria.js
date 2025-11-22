// Gematria Calculator (Hebrew numerology)
// Simplified English gematria based on letter position
export const calculateGematria = (name) => {
  if (!name) return { value: 0, interpretation: '' }

  const cleanName = name.toUpperCase().replace(/[^A-Z]/g, '')
  
  // Simple English gematria (A=1, B=2, etc.)
  let simpleValue = 0
  for (let char of cleanName) {
    simpleValue += char.charCodeAt(0) - 64
  }

  // Reduce to single digit for interpretation
  let reduced = simpleValue
  while (reduced > 9) {
    reduced = reduced.toString().split('').reduce((sum, digit) => sum + parseInt(digit), 0)
  }

  const interpretations = {
    1: 'Unity and new beginnings - A pioneer spirit',
    2: 'Duality and balance - Harmony seeker',
    3: 'Trinity and creativity - Expression of divine',
    4: 'Foundation and stability - Builder of worlds',
    5: 'Change and freedom - Dynamic transformation',
    6: 'Harmony and service - Cosmic responsibility',
    7: 'Spiritual wisdom - Seeker of truth',
    8: 'Abundance and power - Material mastery',
    9: 'Completion and universal love - Humanitarian path'
  }

  return {
    value: simpleValue,
    reduced: reduced,
    interpretation: interpretations[reduced] || 'Unique spiritual path'
  }
}

// Calculate name vibration
export const calculateNameVibration = (firstName, lastName) => {
  const fullName = `${firstName} ${lastName}`.trim()
  return calculateGematria(fullName)
}
