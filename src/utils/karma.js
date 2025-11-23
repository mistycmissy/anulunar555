// Karma and Life Lessons Calculator
export const calculateKarma = (birthDate, fullName) => {
  const date = new Date(birthDate)
  const lifePathNumber = calculateKarmaNumber(date)
  const namePath = calculateNameKarma(fullName)

  const karmaLessons = {
    1: {
      lesson: 'Self-reliance and Independence',
      pastLife: 'You may have been overly dependent on others in past lives',
      currentFocus: 'Develop self-confidence and leadership abilities',
      soulPurpose: 'To learn to stand on your own and pioneer new paths'
    },
    2: {
      lesson: 'Cooperation and Harmony',
      pastLife: 'Previous incarnations may have involved conflict or isolation',
      currentFocus: 'Build partnerships and learn the art of diplomacy',
      soulPurpose: 'To bring peace and balance to relationships'
    },
    3: {
      lesson: 'Creative Expression',
      pastLife: 'You may have suppressed your creativity or self-expression',
      currentFocus: 'Embrace your artistic talents and communicate authentically',
      soulPurpose: 'To inspire others through creative self-expression'
    },
    4: {
      lesson: 'Building and Structure',
      pastLife: 'Past lives may have lacked stability or discipline',
      currentFocus: 'Create solid foundations and establish order',
      soulPurpose: 'To build lasting structures that serve humanity'
    },
    5: {
      lesson: 'Freedom and Change',
      pastLife: 'You may have been confined or restricted in previous lives',
      currentFocus: 'Embrace change and explore new experiences',
      soulPurpose: 'To teach others about adaptability and freedom'
    },
    6: {
      lesson: 'Service and Responsibility',
      pastLife: 'Previous incarnations may have avoided family or community duties',
      currentFocus: 'Take responsibility for others and provide nurturing care',
      soulPurpose: 'To heal and serve your community with love'
    },
    7: {
      lesson: 'Spiritual Wisdom',
      pastLife: 'Past lives may have been too focused on material matters',
      currentFocus: 'Develop inner wisdom and spiritual understanding',
      soulPurpose: 'To seek and share spiritual truths'
    },
    8: {
      lesson: 'Power and Abundance',
      pastLife: 'You may have misused power or resources in past incarnations',
      currentFocus: 'Learn to use power wisely and create abundance ethically',
      soulPurpose: 'To master material success while maintaining spiritual integrity'
    },
    9: {
      lesson: 'Compassion and Completion',
      pastLife: 'Past lives involved many experiences leading to this culmination',
      currentFocus: 'Practice universal love and bring closure to karmic cycles',
      soulPurpose: 'To serve humanity with compassion and wisdom'
    }
  }

  return {
    mainLesson: karmaLessons[lifePathNumber] || karmaLessons[1],
    karmaNumber: lifePathNumber,
    nameKarma: namePath,
    karmicDebt: checkKarmicDebt(date),
    soulContract: generateSoulContract(lifePathNumber, namePath)
  }
}

const calculateKarmaNumber = (date) => {
  const day = date.getDate()
  const month = date.getMonth() + 1
  const year = date.getFullYear()

  let total = day + month + year
  while (total > 9 && total !== 11 && total !== 22 && total !== 33) {
    total = total.toString().split('').reduce((sum, digit) => sum + parseInt(digit), 0)
  }
  return total > 9 ? total % 9 || 9 : total
}

const calculateNameKarma = (name) => {
  if (!name) return 0
  const sum = name.toUpperCase().replace(/[^A-Z]/g, '').split('').reduce((total, char) => {
    return total + (char.charCodeAt(0) - 64)
  }, 0)
  let result = sum
  while (result > 9) {
    result = result.toString().split('').reduce((s, d) => s + parseInt(d), 0)
  }
  return result
}

const checkKarmicDebt = (date) => {
  const day = date.getDate()
  const karmicDebtNumbers = [13, 14, 16, 19]
  
  if (karmicDebtNumbers.includes(day)) {
    const debts = {
      13: 'Learn to work hard and overcome laziness from past lives',
      14: 'Balance freedom with responsibility, avoid excess',
      16: 'Rebuild after destruction, learn humility',
      19: 'Release ego and learn to give rather than take'
    }
    return {
      hasDebt: true,
      number: day,
      message: debts[day]
    }
  }
  
  return { hasDebt: false }
}

const generateSoulContract = (lifePathNumber, nameKarma) => {
  const contracts = [
    'To illuminate the path for others through personal example',
    'To bridge divides and create harmony in discord',
    'To express divine creativity through earthly forms',
    'To build foundations that will outlast this lifetime',
    'To experience all of life and teach freedom through wisdom',
    'To nurture and heal the collective family of humanity',
    'To seek mystical truths and share spiritual knowledge',
    'To manifest abundance and share it generously',
    'To complete the cycle and serve as a wise elder'
  ]
  
  const index = (lifePathNumber + nameKarma) % 9
  return contracts[index]
}
