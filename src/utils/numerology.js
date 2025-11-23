// Numerology Calculator - Life Path, Expression, Soul Urge, etc.

const reduceToSingleDigit = (num) => {
  // Master numbers: 11, 22, 33
  if (num === 11 || num === 22 || num === 33) return num
  
  while (num > 9) {
    num = num.toString().split('').reduce((sum, digit) => sum + parseInt(digit), 0)
  }
  return num
}

const letterValues = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9,
  J: 1, K: 2, L: 3, M: 4, N: 5, O: 6, P: 7, Q: 8, R: 9,
  S: 1, T: 2, U: 3, V: 4, W: 5, X: 6, Y: 7, Z: 8
}

export const calculateLifePath = (birthDate) => {
  const date = new Date(birthDate)
  const day = date.getDate()
  const month = date.getMonth() + 1
  const year = date.getFullYear()

  const daySum = reduceToSingleDigit(day)
  const monthSum = reduceToSingleDigit(month)
  const yearSum = reduceToSingleDigit(year)

  return reduceToSingleDigit(daySum + monthSum + yearSum)
}

export const calculateExpression = (fullName) => {
  if (!fullName) return 0
  
  const cleanName = fullName.toUpperCase().replace(/[^A-Z]/g, '')
  const sum = cleanName.split('').reduce((total, letter) => {
    return total + (letterValues[letter] || 0)
  }, 0)

  return reduceToSingleDigit(sum)
}

export const calculateSoulUrge = (fullName) => {
  if (!fullName) return 0
  
  const vowels = 'AEIOU'
  const cleanName = fullName.toUpperCase().replace(/[^A-Z]/g, '')
  const sum = cleanName.split('').reduce((total, letter) => {
    if (vowels.includes(letter)) {
      return total + (letterValues[letter] || 0)
    }
    return total
  }, 0)

  return reduceToSingleDigit(sum)
}

export const calculatePersonality = (fullName) => {
  if (!fullName) return 0
  
  const vowels = 'AEIOU'
  const cleanName = fullName.toUpperCase().replace(/[^A-Z]/g, '')
  const sum = cleanName.split('').reduce((total, letter) => {
    if (!vowels.includes(letter)) {
      return total + (letterValues[letter] || 0)
    }
    return total
  }, 0)

  return reduceToSingleDigit(sum)
}

export const getNumerologyMeaning = (number) => {
  const meanings = {
    1: { keyword: 'Leadership', traits: 'Independent, pioneering, ambitious, creative, original' },
    2: { keyword: 'Cooperation', traits: 'Diplomatic, sensitive, harmonious, intuitive, patient' },
    3: { keyword: 'Expression', traits: 'Creative, communicative, optimistic, artistic, social' },
    4: { keyword: 'Stability', traits: 'Practical, organized, loyal, hard-working, traditional' },
    5: { keyword: 'Freedom', traits: 'Adventurous, versatile, progressive, curious, dynamic' },
    6: { keyword: 'Responsibility', traits: 'Nurturing, caring, protective, domestic, harmonious' },
    7: { keyword: 'Spirituality', traits: 'Analytical, introspective, spiritual, philosophical, wise' },
    8: { keyword: 'Power', traits: 'Ambitious, organized, successful, material-focused, authoritative' },
    9: { keyword: 'Completion', traits: 'Humanitarian, compassionate, idealistic, generous, wise' },
    11: { keyword: 'Illumination', traits: 'Intuitive, spiritual, inspiring, visionary, master teacher' },
    22: { keyword: 'Master Builder', traits: 'Visionary, practical idealist, powerful manifestor, global thinker' },
    33: { keyword: 'Master Healer', traits: 'Compassionate teacher, nurturing, selfless, spiritual guide' },
  }

  return meanings[number] || meanings[1]
}
